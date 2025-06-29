import React from 'react';
import FileUpload from './FileUpload';
import AssetLibrary from './AssetLibrary';
import AudioMixer from './AudioMixer'; // Import AudioMixer

const Sidebar = () => {
  return (
    <div className="Sidebar">
      <h2>Asset Management</h2>
      <FileUpload />
      <AssetLibrary />
      <AudioMixer /> {/* Add AudioMixer to the sidebar */}
    </div>
  );
};

export default Sidebar;
