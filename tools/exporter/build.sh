pip3 install --upgrade conan
conan install -s build_type=Release -if cmake-build-release -b missing .
cd cmake-build-release || exit
cmake -DCMAKE_BUILD_TYPE=Release ..
cmake --build . -- -j8