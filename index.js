const core = require('@actions/core')
const github = require('@actions/github')

const labels =
  github.context.payload &&
  github.context.payload.pull_request &&
  github.context.payload.pull_request.labels &&
  github.context.payload.pull_request.labels.map(({ name }) => name)

const skip_on = core.getInput('skip_on')
if (skip_on && labels.indexOf(skip_on) !== -1) return

const body =
  github.context.payload &&
  github.context.payload.pull_request &&
  github.context.payload.pull_request.body

// skip if empty
if (!body || !body.length) return

const IGNORE_FROM = '<!-- ignore-task-list-start -->'
const IGNORE_UNTIL = '<!-- ignore-task-list-end -->'

const CHECKS_REGEXP = /^[-*]\s?\[[x\s]?\]\s/i
const COMPLETED_REGEXP = /^[-*]\s?\[[x]?\]\s/i

let lines = body.split('\n').map((str) => str.trim())

const from = lines.findIndex((str) => str === IGNORE_FROM)
const until = lines.findIndex((str) => str === IGNORE_UNTIL)

if (from !== -1 && until !== -1) {
  lines = [...lines.slice(0, from), ...lines.slice(until + 1)]
}

if (!lines.length) return

const checks = lines.filter((str) => CHECKS_REGEXP.test(str))
const completed = checks.filter((str) => COMPLETED_REGEXP.test(str))

const remaining = checks.length - completed.length

if (remaining > 0) {
  core.setFailed(`${remaining} tasks not checked.`)
}
