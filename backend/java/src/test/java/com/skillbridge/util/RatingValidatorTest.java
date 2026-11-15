package com.skillbridge.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RatingValidatorTest {
    @Test
    void acceptsRatingBoundsAndRejectsOutsideThem() {
        assertEquals(1, RatingValidator.validate(1, "rating"));
        assertEquals(5, RatingValidator.validate(5, "rating"));
        assertThrows(IllegalArgumentException.class, () -> RatingValidator.validate(0, "rating"));
        assertThrows(IllegalArgumentException.class, () -> RatingValidator.validate(6, "rating"));
    }
}
