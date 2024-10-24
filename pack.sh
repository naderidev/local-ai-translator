#!/bin/bash

find . \( -name '*.js' -o -name '*.json' \) -print0 | xargs -0 zip extension.zip
