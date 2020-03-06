# RiichiMahjongCalculatorBackend

Complete backend for the Riichi Mahjong Calculator tile recognition system. The "Mahjong OCR" works by first splitting the base image into tiles using
Darkflow's object detector and then classifies these images using google's mobilenet v1 model.



To setup and run this server, the file structure should be similar with
a darkflow folder installed at the root directory as well.


# Dependencies

darkflow and all of it's dependencies:
[Darkflow](https://github.com/thtrieu/darkflow) -> Python3, tensorflow 1.0, numpy, opencv 3

express, fs-extra, mkdrip, socket.io

To run the server locally `node indexOld`. The server listens for socket.io events for "Img" which will process the image as data input.
