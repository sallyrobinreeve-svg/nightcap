import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

import '../theme.dart';

class NightVideoPlayer extends StatefulWidget {
  const NightVideoPlayer({required this.url, super.key});

  final String url;

  @override
  State<NightVideoPlayer> createState() => _NightVideoPlayerState();
}

class _NightVideoPlayerState extends State<NightVideoPlayer> {
  late final VideoPlayerController _controller;
  bool _ready = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.url))
      ..initialize().then((_) {
        if (mounted) setState(() => _ready = true);
      }).catchError((_) {
        if (mounted) setState(() => _error = 'Could not load video.');
      });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Container(
        height: 220,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: NightColors.background,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(_error!, style: const TextStyle(color: NightColors.muted)),
      );
    }

    if (!_ready) {
      return const SizedBox(
        height: 220,
        child: Center(child: CircularProgressIndicator()),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: AspectRatio(
        aspectRatio: _controller.value.aspectRatio == 0
            ? 16 / 9
            : _controller.value.aspectRatio,
        child: Stack(
          alignment: Alignment.center,
          children: [
            VideoPlayer(_controller),
            if (!_controller.value.isPlaying)
              IconButton(
                iconSize: 56,
                color: Colors.white,
                onPressed: () {
                  setState(() => _controller.play());
                },
                icon: const Icon(Icons.play_circle_fill),
              ),
            Positioned(
              right: 8,
              bottom: 8,
              child: IconButton(
                color: Colors.white,
                onPressed: () {
                  setState(() {
                    _controller.value.isPlaying
                        ? _controller.pause()
                        : _controller.play();
                  });
                },
                icon: Icon(
                  _controller.value.isPlaying ? Icons.pause : Icons.play_arrow,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
