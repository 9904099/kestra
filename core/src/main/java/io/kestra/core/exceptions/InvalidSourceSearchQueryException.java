package io.kestra.core.exceptions;

import java.io.Serial;

/**
 * Thrown when a Source Search query cannot be compiled, e.g. an invalid regular expression when
 * the regex option is enabled.
 */
public class InvalidSourceSearchQueryException extends KestraRuntimeException {
    @Serial
    private static final long serialVersionUID = 1L;

    public InvalidSourceSearchQueryException(final String message) {
        super(message);
    }
}
