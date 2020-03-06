#!/bin/bash

for folder in "$1"/*
	do
		for entry in "$folder"
		do
			echo $entry
			read -r W H <<<$(identify -format '%w %h' $entry); echo "$W $H";
			if [ "$W" -ge "$H" ];then
				echo "less";
				convert $entry -rotate -90 $entry
			fi
			convert $entry -resize 232X287 $entry
		done
	done 
