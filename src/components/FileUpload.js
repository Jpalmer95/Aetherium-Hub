import React, { useState, useContext } from 'react';
import { AssetContext } from '../context/AssetProvider';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState('3D_MODEL'); // Default type
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const { addAsset, API_URL } = useContext(AssetContext);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    if (e.target.files[0] && !assetName) {
        // Pre-fill asset name without extension
        const nameWithoutExtension = e.target.files[0].name.split('.').slice(0, -1).join('.');
        setAssetName(nameWithoutExtension);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !assetName || !assetType) {
      setError('Please provide a file, asset name, and asset type.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', assetName);
    formData.append('asset_type', assetType);
    // Optional: Add initial x,y,z etc. if needed from here
    // formData.append('x', 0);
    // formData.append('y', 0);
    // formData.append('z', 0);

    try {
      const response = await fetch(`${API_URL}/assets/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: 'Upload failed with no specific error message.' }));
        throw new Error(errData.detail || `HTTP error! status: ${response.status}`);
      }

      const newAsset = await response.json();
      addAsset(newAsset); // This will trigger a re-fetch in AssetProvider
      setSuccessMessage(`Asset "${newAsset.name}" uploaded successfully!`);
      setFile(null);
      setAssetName('');
      e.target.reset(); // Reset the form input for the file
    } catch (err) {
      setError(err.message);
      console.error('Upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="FileUpload">
      <h3>Upload New Asset</h3>
      {error && <p className="ErrorMessage">Error: {error}</p>}
      {successMessage && <p className="LoadingMessage">{successMessage}</p>} {/* Using LoadingMessage style for success for now */}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="assetName">Asset Name:</label>
          <input
            type="text"
            id="assetName"
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            placeholder="Enter asset name"
            required
          />
        </div>
        <div>
          <label htmlFor="assetType">Asset Type:</label>
          <select
            id="assetType"
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
            required
          >
            <option value="3D_MODEL">3D Model</option>
            <option value="AUDIO">Audio</option>
            <option value="IMAGE">Image</option>
            <option value="VIDEO">Video</option>
            <option value="TEXT">Text</option>
          </select>
        </div>
        <div>
          <label htmlFor="file">File:</label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            required
          />
        </div>
        <button type="submit" disabled={isLoading} className="primary">
          {isLoading ? 'Uploading...' : 'Upload Asset'}
        </button>
      </form>
    </div>
  );
};

export default FileUpload;
