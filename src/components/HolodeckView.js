import React, { useRef, useEffect, useContext, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib/controls/OrbitControls.js';
import { GLTFLoader } from 'three-stdlib/loaders/GLTFLoader.js';
import { AssetContext } from '../context/AssetProvider';

const HolodeckView = () => {
  const mountRef = useRef(null);
  const { selectedAsset, assets, API_URL, updateAssetInList } = useContext(AssetContext);
  const [sceneObjects, setSceneObjects] = useState({}); // Store references to THREE.Object3D by asset.id
  const [currentSelectedMesh, setCurrentSelectedMesh] = useState(null); // For highlighting or gizmos later
  const [transformInputs, setTransformInputs] = useState({ x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0, scaleX: 1, scaleY: 1, scaleZ: 1 });

  // Effect for initializing and cleaning up the Three.js scene
  useEffect(() => {
    const currentMount = mountRef.current;
    let animationFrameId;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x4a4a4a);
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.shadowMap.enabled = true; // Enable shadows
    currentMount.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true; // Enable shadow casting for this light
    scene.add(directionalLight);

    // Ground Plane
    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true; // Enable shadow receiving for the plane
    scene.add(plane);

    // Grid Helper
    const gridHelper = new THREE.GridHelper(20, 20);
    scene.add(gridHelper);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // GLTF Loader
    const loader = new GLTFLoader();

    // Animation loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      // Dispose geometries, materials, textures if necessary to free up more resources
      Object.values(sceneObjects).forEach(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(mat => mat.dispose());
            } else {
                obj.material.dispose();
            }
        }
      });
      cancelAnimationFrame(animationFrameId);
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount

  // Effect for adding/updating assets in the scene
  useEffect(() => {
    const scene = mountRef.current.scene; // Assuming scene is attached to mountRef for access
    if (!scene) return; // Scene might not be initialized yet if the first effect hasn't run

    const loader = new GLTFLoader();

    assets.forEach(asset => {
      if (asset.asset_type === '3D_MODEL' && asset.file_path) {
        if (!sceneObjects[asset.id]) { // If object not yet in scene
          const modelUrl = `${API_URL}/${asset.file_path.replace(/^\.\//, '')}`; // Ensure URL is correct
          loader.load(
            modelUrl,
            (gltf) => {
              const model = gltf.scene;
              model.userData.assetId = asset.id; // Store asset ID for later reference

              // Apply initial transforms from asset data
              model.position.set(asset.x || 0, asset.y || 0, asset.z || 0);
              model.rotation.set(
                THREE.MathUtils.degToRad(asset.rotation_x || 0),
                THREE.MathUtils.degToRad(asset.rotation_y || 0),
                THREE.MathUtils.degToRad(asset.rotation_z || 0)
              );
              model.scale.set(asset.scale_x || 1, asset.scale_y || 1, asset.scale_z || 1);

              // Enable shadow casting for all meshes in the model
              model.traverse(child => {
                if (child.isMesh) {
                  child.castShadow = true;
                  child.receiveShadow = true; // Optional, if models can receive shadows from other models
                }
              });

              scene.add(model);
              setSceneObjects(prev => ({ ...prev, [asset.id]: model }));
            },
            undefined, // onProgress callback (optional)
            (error) => {
              console.error(`Error loading model ${asset.name}:`, error);
            }
          );
        } else { // If object already in scene, update its transform if different
          const existingObject = sceneObjects[asset.id];
          if (existingObject) {
            existingObject.position.set(asset.x || 0, asset.y || 0, asset.z || 0);
            existingObject.rotation.set(
              THREE.MathUtils.degToRad(asset.rotation_x || 0),
              THREE.MathUtils.degToRad(asset.rotation_y || 0),
              THREE.MathUtils.degToRad(asset.rotation_z || 0)
            );
            existingObject.scale.set(asset.scale_x || 1, asset.scale_y || 1, asset.scale_z || 1);
          }
        }
      }
    });

    // Remove objects from scene if their corresponding asset is deleted
    Object.keys(sceneObjects).forEach(assetId => {
      if (!assets.find(asset => asset.id.toString() === assetId)) {
        const objectToRemove = sceneObjects[assetId];
        if (objectToRemove) {
          scene.remove(objectToRemove);
          // Dispose geometry/material if necessary
          if (objectToRemove.geometry) objectToRemove.geometry.dispose();
          if (objectToRemove.material) {
            if (Array.isArray(objectToRemove.material)) {
                objectToRemove.material.forEach(mat => mat.dispose());
            } else {
                objectToRemove.material.dispose();
            }
          }
          setSceneObjects(prev => {
            const newSceneObjects = { ...prev };
            delete newSceneObjects[assetId];
            return newSceneObjects;
          });
        }
      }
    });

  }, [assets, API_URL]); // Re-run when assets list or API_URL changes

  // Effect to update transform inputs when selectedAsset changes
  useEffect(() => {
    if (selectedAsset && selectedAsset.asset_type === '3D_MODEL') {
      const modelInScene = sceneObjects[selectedAsset.id];
      if (modelInScene) {
        setCurrentSelectedMesh(modelInScene); // For potential highlighting
        setTransformInputs({
          x: selectedAsset.x || 0,
          y: selectedAsset.y || 0,
          z: selectedAsset.z || 0,
          rotX: selectedAsset.rotation_x || 0,
          rotY: selectedAsset.rotation_y || 0,
          rotZ: selectedAsset.rotation_z || 0,
          scaleX: selectedAsset.scale_x || 1,
          scaleY: selectedAsset.scale_y || 1,
          scaleZ: selectedAsset.scale_z || 1,
        });
      } else {
        setCurrentSelectedMesh(null);
      }
    } else {
      setCurrentSelectedMesh(null);
    }
  }, [selectedAsset, sceneObjects]);


  const handleTransformChange = (e) => {
    const { name, value } = e.target;
    setTransformInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const applyTransform = async () => {
    if (!selectedAsset || !sceneObjects[selectedAsset.id]) return;

    const updatedAssetData = {
        x: transformInputs.x,
        y: transformInputs.y,
        z: transformInputs.z,
        rotation_x: transformInputs.rotX,
        rotation_y: transformInputs.rotY,
        rotation_z: transformInputs.rotZ,
        scale_x: transformInputs.scaleX,
        scale_y: transformInputs.scaleY,
        scale_z: transformInputs.scaleZ,
    };

    try {
        const response = await fetch(`${API_URL}/assets/${selectedAsset.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedAssetData),
        });
        if (!response.ok) throw new Error('Failed to update asset transform');
        const updatedAssetFromServer = await response.json();
        updateAssetInList(updatedAssetFromServer); // Update context and trigger re-render/scene update
    } catch (error) {
        console.error("Error updating transform:", error);
        // Potentially show an error message to the user
    }
  };

  // Attach scene to mountRef for access in other effects
  useEffect(() => {
    if (mountRef.current && !mountRef.current.scene) {
        const scene = new THREE.Scene(); // This is a simplified re-creation, the main one is in the first useEffect
        mountRef.current.scene = scene;
    }
  }, []);


  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 160px)' /* Adjust as needed */ }}>
      <div ref={mountRef} style={{ flexGrow: 1, height: '100%', position: 'relative' }}>
        {/* The canvas will be appended here by Three.js */}
      </div>
      {selectedAsset && selectedAsset.asset_type === '3D_MODEL' && (
        <div className="TransformControls" style={{ width: '250px', padding: '10px', background: '#20232a', overflowY: 'auto' }}>
          <h4>Transform: {selectedAsset.name}</h4>
          <div>
            Position:
            X: <input type="number" name="x" value={transformInputs.x} onChange={handleTransformChange} step="0.1" />
            Y: <input type="number" name="y" value={transformInputs.y} onChange={handleTransformChange} step="0.1" />
            Z: <input type="number" name="z" value={transformInputs.z} onChange={handleTransformChange} step="0.1" />
          </div>
          <div>
            Rotation (Deg):
            X: <input type="number" name="rotX" value={transformInputs.rotX} onChange={handleTransformChange} step="1" />
            Y: <input type="number" name="rotY" value={transformInputs.rotY} onChange={handleTransformChange} step="1" />
            Z: <input type="number" name="rotZ" value={transformInputs.rotZ} onChange={handleTransformChange} step="1" />
          </div>
          <div>
            Scale:
            X: <input type="number" name="scaleX" value={transformInputs.scaleX} onChange={handleTransformChange} step="0.05" />
            Y: <input type="number" name="scaleY" value={transformInputs.scaleY} onChange={handleTransformChange} step="0.05" />
            Z: <input type="number" name="scaleZ" value={transformInputs.scaleZ} onChange={handleTransformChange} step="0.05" />
          </div>
          <button onClick={applyTransform} style={{marginTop: '10px'}}>Apply Transform</button>
        </div>
      )}
    </div>
  );
};

export default HolodeckView;
