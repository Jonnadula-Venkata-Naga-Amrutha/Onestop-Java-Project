package com.skillbridge.util;

public final class RatingValidator {
    private RatingValidator() {}

    public static int validate(int rating, String field) {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException(field + " must be between 1 and 5.");
        }
        return rating;
    }
}
