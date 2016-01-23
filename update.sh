#!/bin/sh
hugo --theme=hugo-uno-aw
aws s3 sync public s3://www.apswood.uk
