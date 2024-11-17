#!/usr/bin/env bash


echo "⚙️ Stopping verdaccio..."

verdaccio_pid=$(lsof -ti :4873)

if [ -n "$verdaccio_pid" ]; then
 kill $verdaccio_pid
fi

 