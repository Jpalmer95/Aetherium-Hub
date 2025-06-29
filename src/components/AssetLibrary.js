import React, { useContext, useEffect, useRef } from 'react';
import { AssetContext } from '../context/AssetProvider';
import { Howl } from 'howler';

const AssetLibrary = () => {
  const {
    assets,
    selectedAsset,
    setSelectedAsset,
    loading,
    error,
    fetchAssets,
    removeAssetFromList,
    API_URL
  } = useContext(AssetContext);

  const previewHowlRef = useRef(null); // Ref to store the Howl instance for preview

  // Cleanup preview audio when component unmounts or selected asset changes
  useEffect(() => {
    return () => {
      if (previewHowlRef.current) {
        previewHowlRef.current.unload();
        previewHowlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (previewHowlRef.current) {
        previewHowlRef.current.stop(); // Stop previous sound
        previewHowlRef.current.unload();
        previewHowlRef.current = null;
    }
    if (selectedAsset && selectedAsset.asset_type === 'AUDIO') {
        const sound = new Howl({
            src: [`${API_URL}/${selectedAsset.file_path.replace(/^\.\//, '')}`],
            html5: true,
            volume: 0.7,
        });
        previewHowlRef.current = sound;
        // sound.play(); // Optional: auto-play on select. For now, provide manual controls.
    }
  }, [selectedAsset, API_URL]);


  const playPreview = () => {
    if (previewHowlRef.current && !previewHowlRef.current.playing()) {
        previewHowlRef.current.play();
    }
  };

  const pausePreview = () => {
    if (previewHowlRef.current && previewHowlRef.current.playing()) {
        previewHowlRef.current.pause();
    }
  };

  const stopPreview = () => {
    if (previewHowlRef.current) {
        previewHowlRef.current.stop();
    }
  };

  const handleDelete = async (assetId, assetName, event) => {
    event.stopPropagation(); // Prevent selection when clicking delete

    if (window.confirm(`Are you sure you want to delete asset "${assetName}"?`)) {
      try {
        const response = await fetch(`${API_URL}/assets/${assetId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({ detail: 'Deletion failed with no specific error message.' }));
          throw new Error(errData.detail || `HTTP error! status: ${response.status}`);
        }
        removeAssetFromList(assetId);
        // alert(`Asset "${assetName}" deleted successfully.`); // Optional: use a more subtle notification
      } catch (err) {
        alert(`Error deleting asset: ${err.message}`);
        console.error("Deletion error:", err);
      }
    }
  };

  if (loading && !assets.length) { // Show loading only if assets are not yet populated
    return <div className="LoadingMessage">Loading assets...</div>;
  }

  if (error) {
    return <div className="ErrorMessage">Error loading assets: {error} <button className="secondary" onClick={fetchAssets}>Retry</button></div>;
  }

  return (
    <div className="AssetLibrary">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
        <h4>Available Assets ({assets.length})</h4>
        <button onClick={fetchAssets} disabled={loading} className="secondary" style={{fontSize: '0.9em'}}>Refresh</button>
      </div>
      {assets.length === 0 && !loading && <p>No assets found. Upload some!</p>}

      {selectedAsset && selectedAsset.asset_type === 'AUDIO' && previewHowlRef.current && (
        <div className="AudioPreviewControls">
          <h5>Preview: <span style={{fontWeight: 'normal'}}>{selectedAsset.name}</span></h5>
          <button onClick={playPreview} className="primary">Play</button>
          <button onClick={pausePreview} className="warning">Pause</button>
          <button onClick={stopPreview} className="secondary">Stop</button>
        </div>
      )}

      <ul>
        {assets.map((asset) => (
          <li
            key={asset.id}
            className={selectedAsset && selectedAsset.id === asset.id ? 'selected' : ''}
            onClick={() => setSelectedAsset(asset)}
          >
            <span className="asset-name">{asset.name} ({asset.asset_type})</span>
            <button
                onClick={(e) => handleDelete(asset.id, asset.name, e)}
                className="danger"
                disabled={loading}
            >
                X
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AssetLibrary;
