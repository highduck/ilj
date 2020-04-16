#pragma once

#include <ek/util/clock.hpp>
#include <cstdint>

namespace ek {

class timer_t final {
    inline static double now() {
        return clock::now();
    }

public:
    [[nodiscard]]
    double read_seconds() const {
        return now() - initial_;
    }

    [[nodiscard]]
    double read_millis() const {
        return 1000.0 * read_seconds();
    }

    inline void reset() {
        initial_ = now();
    }

private:
    double initial_ = now();
};

}