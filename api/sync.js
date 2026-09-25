/*
 * Reading Foundations — student progress sync (Vercel serverless function).
 *
 * Storage: Upstash Redis over its REST API (add it from the Vercel project's
 * Storage tab; it sets KV_REST_API_URL / KV_REST_API_TOKEN automatically).
 * One Redis hash per class:  rf:<classId>  ->  { <studentId>: <json blob> }
 *
 * Class codes live only in the CLASS_CODES env var, never in the page:
 *   CLASS_CODES="p1=K7P2,p3=M4Q8,p7=T9W3"
 *
 * GET  /api/sync?code=K7P2              -> { ok, cls }            (check a code)
 * GET  /api/sync?code=K7P2&id=stu_x_p1  -> { ok, cls, data }      (one student)
 * GET  /api/sync?code=K7P2&all=1        -> { ok, cls, students }  (whole class)
 * POST /api/sync  {code, id, data}      -> { ok }                 (save one student)
 */

var MAX_BYTES = 200000;

function redisConfig() {
  var url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  var token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ""), token: token } : null;
}

async function redis(cmd) {
  var cfg = redisConfig();
  if (!cfg) { throw new Error("no-db"); }
  var r = await fetch(cfg.url, {
    method: "POST",
    headers: { Authorization: "Bearer " + cfg.token, "Content-Type": "application/json" },
    body: JSON.stringify(cmd)
  });
  var j = await r.json();
  if (!r.ok || j.error) { throw new Error("db: " + (j.error || r.status)); }
  return j.result;
}

function classForCode(code) {
  if (!code) { return null; }
  code = String(code).trim().toUpperCase();
  var pairs = String(process.env.CLASS_CODES || "").split(",");
  for (var i = 0; i < pairs.length; i++) {
    var kv = pairs[i].split("=");
    if (kv.length === 2 && kv[1].trim().toUpperCase() === code && kv[1].trim()) {
      return kv[0].trim();
    }
  }
  return null;
}

/* A student id must belong to the class the code unlocks (ids end in _p1 etc.). */
function idInClass(id, cls) {
  if (typeof id !== "string" || id.length > 80) { return false; }
  var c = cls.replace(/[^a-z0-9]/gi, "");
  return new RegExp("^(stu_[a-z0-9]+_" + c + "|spare_" + c + "_[0-9]+)$").test(id);
}

function send(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(body);
}

module.exports = async function handler(req, res) {
  try {
    var q = req.query || {};
    var body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    var code = req.method === "POST" ? body.code : q.code;
    var cls = classForCode(code);
    if (!cls) { return send(res, 403, { ok: false, error: "bad-code" }); }

    if (req.method === "GET") {
      if (q.all) {
        var flat = (await redis(["HGETALL", "rf:" + cls])) || [];
        var students = {};
        for (var i = 0; i + 1 < flat.length; i += 2) {
          try { students[flat[i]] = JSON.parse(flat[i + 1]); } catch (e) {}
        }
        return send(res, 200, { ok: true, cls: cls, students: students });
      }
      if (q.id) {
        if (!idInClass(q.id, cls)) { return send(res, 403, { ok: false, error: "wrong-class" }); }
        var raw = await redis(["HGET", "rf:" + cls, q.id]);
        var data = null;
        if (raw) { try { data = JSON.parse(raw); } catch (e) {} }
        return send(res, 200, { ok: true, cls: cls, data: data });
      }
      return send(res, 200, { ok: true, cls: cls });
    }

    if (req.method === "POST") {
      if (!idInClass(body.id, cls)) { return send(res, 403, { ok: false, error: "wrong-class" }); }
      var d = body.data;
      if (!d || typeof d !== "object") { return send(res, 400, { ok: false, error: "no-data" }); }

      /* placement/pacer/team/diag are teacher-only fields: a student's routine
         push never includes them (see index.html Sync.dirty/push, which
         only ever sends points/groups). Gate them by TEACHER_PIN once that
         env var is set on Vercel; until then this is a no-op, same as the
         rest of this sync layer before Vercel exists. */
      var touchesTeacherFields = d.placement !== undefined || d.pacer !== undefined || d.team !== undefined || d.diag !== undefined;
      var pin = process.env.TEACHER_PIN;
      if (touchesTeacherFields && pin && body.pin !== pin) {
        return send(res, 403, { ok: false, error: "teacher-pin" });
      }

      /* merge onto whatever is already stored, field by field, so one call
         (a student's points/groups, or a teacher's placement/pacer/team)
         never erases fields it didn't mention */
      var existing = {};
      var existingRaw = await redis(["HGET", "rf:" + cls, body.id]);
      if (existingRaw) { try { existing = JSON.parse(existingRaw) || {}; } catch (e) {} }
      var merged = {
        points: d.points !== undefined ? d.points : (existing.points || {}),
        groups: d.groups !== undefined ? d.groups : (existing.groups || {}),
        placement: d.placement !== undefined ? d.placement : existing.placement,
        pacer: d.pacer !== undefined ? d.pacer : existing.pacer,
        team: d.team !== undefined ? d.team : existing.team,
        diag: d.diag !== undefined ? d.diag : existing.diag,
        saved: new Date().toISOString()
      };
      var json = JSON.stringify(merged);
      if (json.length > MAX_BYTES) { return send(res, 413, { ok: false, error: "too-big" }); }
      await redis(["HSET", "rf:" + cls, body.id, json]);
      return send(res, 200, { ok: true });
    }

    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { ok: false, error: "method" });
  } catch (err) {
    return send(res, 500, { ok: false, error: String(err && err.message || err) });
  }
};

module.exports.classForCode = classForCode;
module.exports.idInClass = idInClass;
