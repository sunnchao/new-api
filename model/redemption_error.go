package model

import (
	"errors"
	"strings"
)

type redeemFailedError struct {
	message string
}

func (e *redeemFailedError) Error() string {
	return e.message
}

func (e *redeemFailedError) Unwrap() error {
	return ErrRedeemFailed
}

func wrapRedeemFailedError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, ErrRedeemFailed) {
		return err
	}
	message := strings.TrimSpace(err.Error())
	if message == "" {
		return ErrRedeemFailed
	}
	return &redeemFailedError{message: message}
}
