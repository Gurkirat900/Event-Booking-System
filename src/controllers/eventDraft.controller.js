import { getDB } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createEventDraft = asyncHandler(async (req, res) => {
  const {
    societyId,
    title,
    description,
    proposedDate,
    proposedLocation,
    parentDraftId,
  } = req.body;

  const db = getDB();
  const [checkLead] = await db.query(
    "select role from society_member where society_id= ? and person_id=? ",
    [societyId, req.user.id]
  );

  if (checkLead.length === 0 || checkLead[0].role !== "lead") {
    throw new ApiError(
      403,
      "Only leads can create event drafts for this society."
    );
  }

  // check if parent draft is provided
  if (parentDraftId) {
    const [parentRows] = await db.query(
      `SELECT id, status FROM event_draft WHERE id = ? AND lead_id = ? AND society_id = ?`,
      [parentDraftId, req.user.id, societyId]
    );

    if (parentRows.length === 0) {
      throw new ApiError(400, "Invalid parent draft ID.");
    }

    const parent = parentRows[0];
    if (parent.status !== "changes_requested" && parent.status !== "rejected") {
      throw new ApiError(
        400,
        "You can only resubmit drafts that were rejected or had changes requested."
      );
    }
  }

  const [result] = await db.query(
    `
    INSERT INTO event_draft 
      (society_id, lead_id, title, description, proposed_date, proposed_location, status, parent_draft_id)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `,
    [
      societyId,
      req.user.id,
      title,
      description,
      proposedDate || null,
      proposedLocation || null,
      parentDraftId || null,
    ]
  );

  if (result.affectedRows == 0) {
    throw new ApiError(500, "Draft was not created");
  }

  const [draftRows] = await db.query("select * from event_draft where id=? ", [
    result.insertId,
  ]);
  const draft = draftRows[0];

  res
    .status(200)
    .json(new ApiResponse(200, draft, "Event draft created successfully"));
});

const approveOrRejectDraft = asyncHandler(async (req, res) => {
  const draftId  = req.params.id;
  const { action, remarks } = req.body;
  const presidentId  = req.user.id;

  if (!["approved", "rejected", "changes_requested"].includes(action)) {
    throw new ApiError(
      400,
      "Invalid action. Must be 'approved', 'rejected', or 'changes_requested'."
    );
  }

  // fetch draft with details
  const db = getDB();
  const [draftRows] = await db.query(
    `SELECT d.*, s.president_id 
     FROM event_draft AS d
     LEFT JOIN society AS s ON d.society_id = s.id
     WHERE d.id = ?`,
    [draftId]
  );



  if (draftRows.length === 0) {
    throw new ApiError(404, "Draft not found.");
  }
  const draft = draftRows[0];

  // verify president of this society
  if (draft.president_id !== presidentId) {
    throw new ApiError(
      403,
      "Only the president of this society can approve or reject drafts."
    );
  }

  if (draft.status !== "pending") {
    throw new ApiError(400, `Draft already ${draft.status}.`);
  }

  // insert in approval
  const [approvalObject] = await db.query(
    `INSERT INTO approval (draft_id, president_id, status, remarks)
     VALUES (?, ?, ?, ?)`,
    [draftId, presidentId, action, remarks || null]
  );

  const approvalId = approvalObject.insertId;
  const [approvalRows] = await db.query("select * from approval where id=? ", [
    approvalId,
  ]);
  const approval = approvalRows[0];

  // Update draft status
  await db.query(
    `UPDATE event_draft 
     SET status = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [action, draftId]
  );

  // If approved, insert or update event table
  if (action === "approved") {
    if (draft.event_id) {
      // Update existing event
      await db.query(
        `UPDATE event 
         SET name = ?, description = ?, date = ?, location = ?, approved_by = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [
          draft.title,
          draft.description,
          draft.proposed_date,
          draft.proposed_location,
          presidentId,
          draft.event_id,
        ]
      );
    } else {
      // Insert new event — default status is 'published'
      const [insertEvent] = await db.query(
        `INSERT INTO event (society_id, name, description, date, location, created_by, approved_by, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`,
        [
          draft.society_id,
          draft.title,
          draft.description,
          draft.proposed_date,
          draft.proposed_location,
          draft.lead_id,
          presidentId,
        ]
      );

      const newEventId = insertEvent.insertId;

      // Link new event to draft
      await db.query(`UPDATE event_draft SET event_id = ? WHERE id = ?`, [
        newEventId,
        draftId,
      ]);
    }
  }

  res
    .status(200)
    .json(new ApiResponse(200, { approval }, `Draft ${action} successfully.`));
});

export { createEventDraft, approveOrRejectDraft };
