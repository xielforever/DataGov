package approvals

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"datagov/backend/internal/modules/iam"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrApprovalNotFound         = errors.New("approval request not found")
	ErrApprovalAlreadyProcessed = errors.New("approval request already processed")
	ErrInvalidAction            = errors.New("invalid approval action")
)

type Service struct {
	db *pgxpool.Pool
}

type Approval struct {
	ID          string         `json:"id"`
	ModuleType  string         `json:"moduleType"`
	Title       string         `json:"title"`
	Applicant   string         `json:"applicant"`
	ApplyTime   string         `json:"applyTime"`
	Reason      string         `json:"reason"`
	Status      string         `json:"status"`
	ProcessTime string         `json:"processTime,omitempty"`
	Processor   string         `json:"processor,omitempty"`
	Payload     map[string]any `json:"payload"`
}

type ProcessRequest struct {
	Action  string `json:"action"`
	Comment string `json:"comment,omitempty"`
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (service *Service) List(ctx context.Context) ([]Approval, error) {
	rows, err := service.db.Query(ctx, `
		SELECT id, module_type, title, applicant_name, reason, status, payload, apply_time, process_time, processor_name
		FROM approval_requests
		ORDER BY
			CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
			apply_time DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Approval, 0)
	for rows.Next() {
		item, err := scanApproval(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (service *Service) Process(ctx context.Context, id string, request ProcessRequest, processor iam.UserProfile) (Approval, error) {
	action := strings.TrimSpace(request.Action)
	status := ""
	switch action {
	case "approve":
		status = "approved"
	case "reject":
		status = "rejected"
	default:
		return Approval{}, ErrInvalidAction
	}

	commandTag, err := service.db.Exec(ctx, `
		UPDATE approval_requests
		SET status = $1,
		    process_time = now(),
		    processor_id = $2,
		    processor_name = $3,
		    process_comment = $4,
		    updated_at = now()
		WHERE id = $5
		  AND status = 'pending'
	`, status, processor.ID, displayName(processor), strings.TrimSpace(request.Comment), id)
	if err != nil {
		return Approval{}, err
	}
	if commandTag.RowsAffected() == 0 {
		exists, err := service.exists(ctx, id)
		if err != nil {
			return Approval{}, err
		}
		if !exists {
			return Approval{}, ErrApprovalNotFound
		}
		return Approval{}, ErrApprovalAlreadyProcessed
	}

	return service.Get(ctx, id)
}

func (service *Service) Get(ctx context.Context, id string) (Approval, error) {
	row := service.db.QueryRow(ctx, `
		SELECT id, module_type, title, applicant_name, reason, status, payload, apply_time, process_time, processor_name
		FROM approval_requests
		WHERE id = $1
	`, id)
	return scanApproval(row)
}

func (service *Service) exists(ctx context.Context, id string) (bool, error) {
	var exists bool
	err := service.db.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM approval_requests WHERE id = $1)`, id).Scan(&exists)
	return exists, err
}

type approvalScanner interface {
	Scan(dest ...any) error
}

func scanApproval(scanner approvalScanner) (Approval, error) {
	var item Approval
	var payloadBytes []byte
	var applyTime time.Time
	var processTime *time.Time
	if err := scanner.Scan(
		&item.ID,
		&item.ModuleType,
		&item.Title,
		&item.Applicant,
		&item.Reason,
		&item.Status,
		&payloadBytes,
		&applyTime,
		&processTime,
		&item.Processor,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Approval{}, ErrApprovalNotFound
		}
		return Approval{}, err
	}

	item.ApplyTime = applyTime.Local().Format("2006-01-02 15:04:05")
	if processTime != nil {
		item.ProcessTime = processTime.Local().Format("2006-01-02 15:04:05")
	}
	if len(payloadBytes) > 0 {
		if err := json.Unmarshal(payloadBytes, &item.Payload); err != nil {
			return Approval{}, err
		}
	}
	if item.Payload == nil {
		item.Payload = map[string]any{}
	}
	return item, nil
}

func displayName(profile iam.UserProfile) string {
	if strings.TrimSpace(profile.RealName) != "" {
		return profile.RealName
	}
	return profile.Username
}
