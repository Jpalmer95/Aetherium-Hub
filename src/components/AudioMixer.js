import React, { useState, useEffect, useContext } from 'react';
import { Howl } from 'howler';
import { AssetContext } from '../context/AssetProvider';

const AudioMixer = () => {
  const { assets, API_URL } = useContext(AssetContext);
  const [tracks, setTracks] = useState([]); // { asset, howl, volume, isPlaying }
  const [masterPlaying, setMasterPlaying] = useState(false);

  useEffect(() => {
    // Cleanup Howler instances when component unmounts or tracks change
    return () => {
      tracks.forEach(track => track.howl.unload());
    };
  }, [tracks]);

  const addTrack = (asset) => {
    if (asset.asset_type !== 'AUDIO' || tracks.find(t => t.asset.id === asset.id)) {
      return; // Only add audio assets and prevent duplicates
    }

    const howl = new Howl({
      src: [`${API_URL}/${asset.file_path.replace(/^\.\//, '')}`],
      html5: true, // Recommended for longer audio files / streaming
      volume: 0.5, // Default volume
      onplay: () => updateTrackState(asset.id, { isPlaying: true }),
      onpause: () => updateTrackState(asset.id, { isPlaying: false }),
      onstop: () => updateTrackState(asset.id, { isPlaying: false }),
      onend: () => updateTrackState(asset.id, { isPlaying: false }),
    });

    setTracks(prevTracks => [...prevTracks, { asset, howl, volume: 0.5, isPlaying: false }]);
  };

  const removeTrack = (assetId) => {
    const trackToRemove = tracks.find(t => t.asset.id === assetId);
    if (trackToRemove) {
      trackToRemove.howl.unload();
    }
    setTracks(prevTracks => prevTracks.filter(t => t.asset.id !== assetId));
  };

  const updateTrackState = (assetId, updates) => {
    setTracks(prevTracks =>
      prevTracks.map(t => t.asset.id === assetId ? { ...t, ...updates } : t)
    );
  };

  const togglePlayPauseTrack = (assetId) => {
    const track = tracks.find(t => t.asset.id === assetId);
    if (track) {
      if (track.howl.playing()) {
        track.howl.pause();
      } else {
        track.howl.play();
      }
    }
  };

  const changeVolume = (assetId, volume) => {
    const track = tracks.find(t => t.asset.id === assetId);
    if (track) {
      track.howl.volume(parseFloat(volume));
      updateTrackState(assetId, { volume: parseFloat(volume) });
    }
  };

  const toggleMasterPlayPause = () => {
    const newMasterPlayingState = !masterPlaying;
    setMasterPlaying(newMasterPlayingState);
    tracks.forEach(track => {
      if (newMasterPlayingState) {
        if (!track.howl.playing()) track.howl.play();
      } else {
        if (track.howl.playing()) track.howl.pause();
      }
    });
  };

  // Filter available audio assets that are not yet in the mixer
  const availableAudioAssets = assets.filter(
    asset => asset.asset_type === 'AUDIO' && !tracks.find(t => t.asset.id === asset.id)
  );

  return (
    <div className="AudioMixer">
      <h3>Audio Mixer</h3>
      <div>
        <select
            onChange={(e) => {
                const assetId = parseInt(e.target.value);
                if (assetId) {
                    const assetToAdd = assets.find(a => a.id === assetId);
                    if (assetToAdd) addTrack(assetToAdd);
                }
                e.target.value = ""; // Reset select
            }}
            defaultValue=""
        >
          <option value="" disabled>Add Audio Track...</option>
          {availableAudioAssets.map(asset => (
            <option key={asset.id} value={asset.id}>{asset.name}</option>
          ))}
        </select>
      </div>

      {tracks.length > 0 && (
        <button
          onClick={toggleMasterPlayPause}
          className={masterPlaying ? 'warning' : 'primary'}
          style={{marginBottom: '15px', width: '100%'}}
        >
          {masterPlaying ? 'Pause All Tracks' : 'Play All Tracks'}
        </button>
      )}

      {tracks.map(({ asset, howl, volume, isPlaying }) => (
        <div key={asset.id} className="track-item">
          <div className="track-header">
            <span className="track-name">{asset.name}</span>
            <button onClick={() => removeTrack(asset.id)} className="danger" style={{fontSize: '0.85em'}}>Remove</button>
          </div>
          <div className="track-controls">
            <button
              onClick={() => togglePlayPauseTrack(asset.id)}
              className={isPlaying ? 'warning' : 'primary'}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => changeVolume(asset.id, e.target.value)}
            />
            <span className="volume-label">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      ))}
      {tracks.length === 0 && <p>No audio tracks added yet.</p>}
    </div>
  );
};

export default AudioMixer;
