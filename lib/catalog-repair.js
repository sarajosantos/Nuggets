"use strict";

const GENERIC_ORNAMENT = "❦";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

// Repairs only the exact footprint left by the original Studio serializer:
// missing world-level casts and its generic fallback ornament. Everything
// else—including story edits—is preserved byte-for-byte as JSON values.
function repairBuiltinWorldRow(row, builtin) {
  if (!row || !builtin || row.id !== builtin.id) return null;

  let changed = false;
  const repaired = {};

  for (const field of ["draft_data", "published_data"]) {
    const current = row[field];
    if (!current || typeof current !== "object") {
      repaired[field] = current;
      continue;
    }

    const next = clone(current);
    if (
      (!Array.isArray(next.archetypes) || next.archetypes.length === 0) &&
      Array.isArray(builtin.archetypes) &&
      builtin.archetypes.length > 0
    ) {
      next.archetypes = clone(builtin.archetypes);
      changed = true;
    }
    if (next.ornament === GENERIC_ORNAMENT && builtin.ornament !== GENERIC_ORNAMENT) {
      next.ornament = builtin.ornament;
      changed = true;
    }
    repaired[field] = next;
  }

  return changed ? repaired : null;
}

module.exports = { repairBuiltinWorldRow };
