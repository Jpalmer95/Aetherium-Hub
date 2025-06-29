import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AssetContext = createContext();

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const AssetProvider = ({ children }) => {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/assets`);
      if (!response.ok) {
        throw new Error(`Failed to fetch assets: ${response.statusText}`);
      }
      const data = await response.json();
      setAssets(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching assets:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const addAsset = (newAsset) => {
    // This will typically be handled by re-fetching or optimistic update
    // For now, just re-fetch to see the new asset
    fetchAssets();
  };

  const updateAssetInList = (updatedAsset) => {
    setAssets(prevAssets =>
      prevAssets.map(asset => asset.id === updatedAsset.id ? updatedAsset : asset)
    );
    if (selectedAsset && selectedAsset.id === updatedAsset.id) {
        setSelectedAsset(updatedAsset);
    }
  };

  const removeAssetFromList = (assetId) => {
    setAssets(prevAssets => prevAssets.filter(asset => asset.id !== assetId));
    if (selectedAsset && selectedAsset.id === assetId) {
        setSelectedAsset(null);
    }
  };

  return (
    <AssetContext.Provider value={{
        assets,
        fetchAssets,
        addAsset,
        updateAssetInList,
        removeAssetFromList,
        selectedAsset,
        setSelectedAsset,
        loading,
        error,
        API_URL
    }}>
      {children}
    </AssetContext.Provider>
  );
};
