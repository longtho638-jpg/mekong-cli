/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Base request for command execution
 */
export type backend__models__command__CommandRequest = {
    /**
     * Command prompt
     */
    prompt: string;
    /**
     * Vibe setting
     */
    vibe?: (string | null);
    /**
     * Override AI provider
     */
    override_provider?: (string | null);
};

