target_sources(${PROJECT_NAME} PUBLIC

        internal/compiler_unsafe_begin.h
        internal/compiler_unsafe_end.h
        common.hpp
        serialize_math.hpp

        vec.hpp
        matrix_decl.hpp
        mat.hpp
        mat2x2.hpp
        mat3x2.hpp
        mat3x3.hpp
        mat4x4.hpp
        matrix_inverse.hpp
        matrix_camera.hpp
        matrix_transform.hpp
        matrix_transpose.hpp
        quaternion.hpp

        box.hpp
        circle.hpp
        bounds_builder.hpp

        hvs_color.hpp
        color_transform.hpp
        packed_color.hpp

        transform.hpp

        easing.hpp

        collisions.hpp
        collisions_sweep.cpp
        collisions_test.cpp

        rand.cpp
        rand.hpp

        internal/static_check.hpp
        internal/static_check.cpp
        )