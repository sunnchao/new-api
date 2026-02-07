package common

import "testing"

func TestStableRolloutBucketDeterministic(t *testing.T) {
	key := "claude-long-prompt:123"
	b1 := StableRolloutBucket(key)
	b2 := StableRolloutBucket(key)
	if b1 != b2 {
		t.Fatalf("bucket not deterministic: %d != %d", b1, b2)
	}
	if b1 < 0 || b1 >= claudeRolloutBuckets {
		t.Fatalf("bucket out of range: %d", b1)
	}
}

func TestShouldApplyPercentRolloutBoundaries(t *testing.T) {
	key := "user:1"
	if ShouldApplyPercentRollout(key, 0) {
		t.Fatalf("expected rollout 0%% to be false")
	}
	if !ShouldApplyPercentRollout(key, 100) {
		t.Fatalf("expected rollout 100%% to be true")
	}
}

func TestShouldApplyPercentRolloutMatches50PercentThreshold(t *testing.T) {
	key := "user:42"
	bucket := StableRolloutBucket(key)
	got := ShouldApplyPercentRollout(key, 50)
	want := bucket < 5000
	if got != want {
		t.Fatalf("rollout mismatch: bucket=%d got=%v want=%v", bucket, got, want)
	}
}

func TestCompletionRatioMultiplierFromPrices(t *testing.T) {
	got := CompletionRatioMultiplierFromPrices(2.0, 1.5)
	if got != 0.75 {
		t.Fatalf("expected 0.75, got %v", got)
	}
}

func TestApplyClaudeLongPromptTier(t *testing.T) {
	modelRatio := 2.5
	completionRatio := 5.0

	// Not applied at or below threshold.
	newModelRatio, newCompletionRatio, applied := ApplyClaudeLongPromptTier(
		200000,
		200000,
		2.0,
		1.5,
		modelRatio,
		completionRatio,
	)
	if applied {
		t.Fatalf("expected not applied at threshold")
	}
	if newModelRatio != modelRatio || newCompletionRatio != completionRatio {
		t.Fatalf("unexpected change when not applied: (%v,%v)", newModelRatio, newCompletionRatio)
	}

	// Applied above threshold.
	newModelRatio, newCompletionRatio, applied = ApplyClaudeLongPromptTier(
		200001,
		200000,
		2.0,
		1.5,
		modelRatio,
		completionRatio,
	)
	if !applied {
		t.Fatalf("expected applied")
	}
	if newModelRatio != 5.0 {
		t.Fatalf("expected modelRatio=5, got %v", newModelRatio)
	}
	if newCompletionRatio != 3.75 {
		t.Fatalf("expected completionRatio=3.75, got %v", newCompletionRatio)
	}
}

func TestShouldApplyClaudeLongPromptRolloutAllowlist(t *testing.T) {
	userID := 42
	allowlist := []int{1, 2, 42, 100}
	if !ShouldApplyClaudeLongPromptRollout(userID, allowlist) {
		t.Fatalf("expected allowlisted user to be enabled")
	}
	if ShouldApplyClaudeLongPromptRollout(userID+1, allowlist) {
		t.Fatalf("expected non-allowlisted user to be disabled")
	}
}

func TestShouldApplyClaudeLongPromptRolloutEmptyAllowlistDisables(t *testing.T) {
	userID := 42
	if ShouldApplyClaudeLongPromptRollout(userID, nil) {
		t.Fatalf("expected empty allowlist to disable all users")
	}
}
