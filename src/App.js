import React, { useRef, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import ReactPlayer from 'react-player/lazy';
import './App.css';

const useWavesurfer = (containerRef, audioSrc) => {
  const [wavesurfer, setWavesurfer] = useState(null);

  useEffect(() => {
    if (!containerRef.current || !audioSrc) return;

    const ws = WaveSurfer.create({ container: containerRef.current });

    ws.load(audioSrc);

    setWavesurfer(ws);

    return () => {
      ws.destroy();
    };
  }, [containerRef, audioSrc]);

  return wavesurfer;
};

function App() {
  const [videoSrc, setVideoSrc] = useState('');
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [metadata, setMetadata] = useState({});
  const audioRef = useRef(null);
  const waveformRef = useRef(null);

  const wavesurfer = useWavesurfer(waveformRef, audioRef.current ? audioRef.current.src : null);

  const handleVideoChange = (event) => {
    const file = event.target.files[0];
    setVideoSrc(URL.createObjectURL(file));

    const fileSize = (file.size / (1024 * 1024)).toFixed(2); // Convert to MB
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      const resolution = `${video.videoWidth}x${video.videoHeight}`;
      setMetadata({ fileSize: `${fileSize} MB`, resolution, Duration: '00:00:00' });
    };
  };

  const handleDuration = (duration) => {
    if (isFinite(duration)) {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      const seconds = Math.floor(duration % 60);

      const formattedDuration = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      setDuration(duration);
      setMetadata({ ...metadata, Duration: formattedDuration });
    }
  };

  const handleSeek = (newTime) => {
    if (isFinite(duration)) {
      const seekToTime = newTime / duration;
      audioRef.current.currentTime = duration * seekToTime;
      wavesurfer && wavesurfer.seekTo(seekToTime);
    }
  };

  const handleWaveformReady = () => {
    wavesurfer &&
      wavesurfer.on('ready', () => {
        const maxVolume = wavesurfer.getVolume() * 100;
        if (maxVolume < 30) {
          alert('Maximum volume is too low. Please choose another video.');
          setVideoSrc('');
        }
      });
  };

  return (
    <div className="container">
      <div className="video-container">
        <div className="video" style={{ marginLeft: '200px' }}>
          <input type="file" accept="video/*" onChange={handleVideoChange} />
          <ReactPlayer
            url={videoSrc}
            controls
            playing={playing}
            onDuration={handleDuration}
            onProgress={(state) => {
              if (audioRef.current && isFinite(duration) && isFinite(state.playedSeconds)) {
                audioRef.current.currentTime = state.playedSeconds;
                wavesurfer && wavesurfer.seekTo(state.played);
              }
            }}
            onSeek={(newTime) => handleSeek(newTime)}
          />
        </div>
        {videoSrc && (
          <>
            <div className="metadata">
              {Object.entries(metadata).map(([key, value]) => (
                <p key={key}>
                  {key}: {value}
                </p>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="waveform" ref={waveformRef} />
      <audio ref={audioRef} src={videoSrc} onCanPlayThrough={handleWaveformReady} />
    </div>
  );
}

export default App;
