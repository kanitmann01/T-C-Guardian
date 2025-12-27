# Data Schema: T&C Guardian

## 1. Analysis Object (LLM Output)

This object is the core output from the "Paranoid Lawyer" engine. It represents the analysis of a specific clause within a document.

**Format:** JSON

```json
{
  "analysis_result": {
    "document_summary": "string - High level summary of the entire document",
    "overall_danger_score": "integer - 0-100",
    "clauses": [
      {
        "id": "string - unique UUID for this analysis item",
        "clause_text": "string - The exact original text text from the contract",
        "category": "string - e.g., 'Data Rights', 'Arbitration', 'Hidden Fees', 'Auto-Renewal', 'IP Ownership'",
        "simplified_explanation": "string - ELI5 explanation of what this means",
        "severity_score": "integer - 1-10 (1=Safe, 10=Predatory)",
        "legal_context": "string - Explanation of why this matters based on user's jurisdiction (e.g., 'Violates GDPR Art 17')",
        "actionable_step": "string - specific advice (e.g., 'Request removal', 'Opt-out via email')",
        "flags": [
          "string - e.g., 'Red Flag', 'Unusual for Industry', 'Standard Boilerplate'"
        ]
      }
    ]
  }
}
```

## 2. Document & Metadata (Firestore)

Stores the document itself and its processing status.

**Collection:** `documents`

```json
{
  "id": "string - UUID",
  "user_id": "string - Reference to users collection",
  "upload_timestamp": "timestamp",
  "file_name": "string",
  "file_type": "string - 'pdf', 'docx', 'url'",
  "content_hash": "string - SHA-256 of extracted text (for caching)",
  "text_content": "string - Sanitized full text (stored in Google Cloud Storage if large, or Firestore if small)",
  "status": "string - 'processing', 'completed', 'failed'",
  "jurisdiction": "string - e.g., 'US-CA', 'EU-DE', 'IN'",
  "analysis_ref": "reference - Pointer to the analysis results"
}
```

## 3. Community Knowledge Base (Cache)

Used to serve instant results for common terms (e.g., Netflix, Spotify).

**Collection:** `global_contracts`

```json
{
  "hash_id": "string - SHA-256 of the contract text (Document ID)",
  "company_name": "string - e.g., 'Netflix'",
  "document_title": "string - e.g., 'Terms of Use 2025'",
  "last_analyzed": "timestamp",
  "cached_analysis": {
     // ... exact copy of the Analysis Object (clauses etc.)
  },
  "access_count": "integer - number of times this cache was hit"
}
```

## 4. User Profile

Required for Geo-Legal context.

**Collection:** `users`

```json
{
  "uid": "string - Firebase Auth ID",
  "email": "string",
  "display_name": "string",
  "default_jurisdiction": "string - e.g., 'US-CA' (California)",
  "subscription_tier": "string - 'free', 'premium' (for advanced AI models)",
  "history": [
    "reference - list of document IDs analyzed"
  ],
  "active_negotiations": [
    "reference - list of negotiation IDs"
  ]
}

## 5. Negotiation Tracker

Tracks the status of emails/requests sent to companies.

**Collection:** `negotiations`

```json
{
  "id": "string - UUID",
  "user_id": "string - Reference to users",
  "document_reference": "string - Reference to the document being contested",
  "company_name": "string",
  "clause_contested": "string - ID of the specific clause",
  "email_generated_at": "timestamp",
  "email_content": "string - The exact text generated",
  "status": "string - 'draft_generated', 'sent', 'replied', 'resolved', 'ignored'",
  "notes": "string - User's manual notes on the progress",
  "last_updated": "timestamp"
}
```
```
