cmake_minimum_required(VERSION 3.13)
project(exporter)

include(${CMAKE_BINARY_DIR}/conanbuildinfo.cmake)
conan_basic_setup(NO_OUTPUT_DIRS)

add_subdirectory(miniz)

add_executable(${PROJECT_NAME} src/main.cpp)
add_subdirectory(src)

target_link_libraries(${PROJECT_NAME} ${CONAN_LIBS} miniz)

if (CMAKE_BUILD_TYPE MATCHES Debug)
    target_compile_options(${PROJECT_NAME} PRIVATE -g)
else ()
    target_compile_options(${PROJECT_NAME} PRIVATE -Os)
endif ()

target_link_libraries(${PROJECT_NAME}
        "-framework CoreGraphics"
        "-framework CoreFoundation"
        )

set_target_properties(${PROJECT_NAME} PROPERTIES
        C_STANDARD 11
        CXX_STANDARD 17
        CXX_STANDARD_REQUIRED YES
        CXX_EXTENSIONS NO
        )

#target_link_libraries(${PROJECT_NAME}
#        ek-editor
#        )

set_target_properties(${PROJECT_NAME} PROPERTIES
        RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_LIST_DIR}/bin")