package httpx

import (
	"encoding/json"
	"net/http"
)

type Response struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}

func JSON(w http.ResponseWriter, status int, code int, message string, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(Response{
		Code:    code,
		Message: message,
		Data:    data,
	})
}

func Success(w http.ResponseWriter, data any) {
	JSON(w, http.StatusOK, 0, "success", data)
}

func Error(w http.ResponseWriter, status int, code int, message string) {
	JSON(w, status, code, message, nil)
}
