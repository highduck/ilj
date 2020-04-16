install dependencies:

```
pip3 install --upgrade conan
conan install -s build_type=Release -if cmake-build-debug -b missing .
```


updage:
fmt/5.3.0@bincrafters/stable

cairo has dependency:
freetype/2.10.0@bincrafters/stable