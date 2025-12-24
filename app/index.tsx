import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from "react-native";
import { VideoView, useVideoPlayer, VideoSource } from "expo-video";
import { setAudioModeAsync } from "expo-audio";
import * as DocumentPicker from "expo-document-picker";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  PictureInPicture,
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function VideoPlayer() {
  const [videoSource, setVideoSource] = useState<VideoSource | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [showControls, setShowControls] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isPiP, setIsPiP] = useState(false);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
      interruptionModeAndroid: "doNotMix",
    });
  }, []);

  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
    player.muted = false;
    player.staysActiveInBackground = true;
    player.showNowPlayingNotification = true;
  });

  const controlsTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!videoSource) return;
    const interval = setInterval(() => {
      try {
        if (player) {
          setPosition(player.currentTime * 1000);
          setDuration(player.duration * 1000);
        }
      } catch (error) {
        console.log("Error accessing player:", error);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [player, videoSource]);

  const resetControlsTimeout = () => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    setShowControls(true);
    controlsTimeout.current = setTimeout(() => {
      if (player?.playing) {
        setShowControls(false);
      }
    }, 3000);
  };

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setVideoSource({
          uri: asset.uri,
          metadata: {
            title: asset.name,
            artist: "My Video App",
          },
        });
        setFileName(asset.name);
        setPosition(0);
      }
    } catch (error) {
      console.error("Error picking video:", error);
    }
  };

  const togglePlayPause = () => {
    if (player) {
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
    }
  };

  const seekTime = (seconds: number) => {
    if (player) {
      const newPosition = Math.max(0, Math.min(position / 1000 + seconds, duration / 1000));
      player.currentTime = newPosition;
    }
  };

  const changePlaybackSpeed = () => {
    if (player) {
      const speeds = [1.0, 1.25, 1.5, 2.0];
      const currentIndex = speeds.indexOf(playbackRate);
      const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
      player.playbackRate = nextSpeed;
      setPlaybackRate(nextSpeed);
    }
  };

  const videoViewRef = useRef<VideoView>(null);

  const togglePiP = async () => {
    if (videoViewRef.current) {
      try {
        await videoViewRef.current.startPictureInPicture();
      } catch (error) {
        console.log("Error starting PiP:", error);
      }
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  useEffect(() => {
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <Pressable 
        style={styles.videoContainer}
        onPress={() => {
          resetControlsTimeout();
        }}
      >
        {videoSource ? (
          <>
            <VideoView
              ref={videoViewRef}
              player={player}
              style={styles.video}
              allowsFullscreen
              allowsPictureInPicture
              startsPictureInPictureAutomatically={true}
              contentFit="contain"
              nativeControls={isPiP}
              onPictureInPictureStart={() => setIsPiP(true)}
              onPictureInPictureStop={() => setIsPiP(false)}
            />
            
            {showControls && (
              <>
                <View style={styles.topOverlay}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {fileName}
                  </Text>
                </View>

                <View style={styles.centerControls}>
                  <TouchableOpacity
                    style={styles.seekButton}
                    onPress={() => seekTime(-5)}
                  >
                    <SkipBack size={32} color="#fff" />
                    <Text style={styles.seekText}>-5s</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={togglePlayPause}
                  >
                    {player?.playing ? (
                      <Pause size={48} color="#fff" fill="#fff" />
                    ) : (
                      <Play size={48} color="#fff" fill="#fff" />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.seekButton}
                    onPress={() => seekTime(5)}
                  >
                    <SkipForward size={32} color="#fff" />
                    <Text style={styles.seekText}>+5s</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.bottomControls}>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${progressPercentage}%` },
                        ]}
                      />
                      <View
                        style={[
                          styles.progressThumb,
                          { left: `${progressPercentage}%` },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.controlsRow}>
                    <View style={styles.leftControls}>
                      <TouchableOpacity
                        style={styles.controlButton}
                        onPress={togglePlayPause}
                      >
                        {player?.playing ? (
                          <Pause size={24} color="#fff" />
                        ) : (
                          <Play size={24} color="#fff" />
                        )}
                      </TouchableOpacity>
                      <Text style={styles.timeText}>
                        {formatTime(position)} / {formatTime(duration)}
                      </Text>
                    </View>

                    <View style={styles.rightControls}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={togglePiP}
                      >
                        <PictureInPicture size={20} color="#fff" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={changePlaybackSpeed}
                      >
                        <Text style={styles.buttonText}>{playbackRate}x</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No video selected</Text>
            <TouchableOpacity style={styles.pickButton} onPress={pickVideo}>
              <Text style={styles.pickButtonText}>Pick Video</Text>
            </TouchableOpacity>
          </View>
        )}
      </Pressable>

      {videoSource && showControls && (
        <TouchableOpacity style={styles.changeVideoButton} onPress={pickVideo}>
          <Text style={styles.changeVideoText}>Change Video</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  videoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  fileName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  centerControls: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 48,
  },
  seekButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  seekText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  progressContainer: {
    marginBottom: 16,
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    position: "relative",
  },
  progressFill: {
    height: 4,
    backgroundColor: "#FF4444",
    borderRadius: 2,
  },
  progressThumb: {
    position: "absolute",
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF4444",
    marginLeft: -8,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rightControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  controlButton: {
    padding: 8,
  },
  timeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  iconButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 6,
    minWidth: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  emptyText: {
    color: "#888",
    fontSize: 18,
    fontWeight: "500",
  },
  pickButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: "#4A90E2",
    borderRadius: 12,
  },
  pickButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  changeVideoButton: {
    position: "absolute",
    top: 20,
    right: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "rgba(74, 144, 226, 0.9)",
    borderRadius: 8,
  },
  changeVideoText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
