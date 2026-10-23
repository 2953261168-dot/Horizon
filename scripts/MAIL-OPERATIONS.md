# Delivery recovery

The October 23 incident is a repository-level GitHub Actions suspension. The
public Actions page says workflows are not being run on this fork because of
Actions usage scale. Individual workflow API records still report `active`.
No October 23 generation, SMTP attempt, or delivered edition was found.

Schedule retries do not bypass a repository-level suspension. No successful
delivery should be claimed until a runner completes the SMTP step.

## Automatic path after the execution service is available

- Prepare at 06:17 Beijing, with a 07:17 backup that skips an existing edition.
- Keep the 08:00 mail trigger and add off-peak retries through 11:47.
- A successful main-branch preparation also starts the mail workflow. It waits
  until 08:00 before normal morning delivery.
- Missing today's edition logs `no email sent`; it never substitutes yesterday.
- The dedicated sender explicitly enables email, independently of generation's
  temporary no-email configuration.
- Before SMTP, claim the edition on the separate `horizon-mail-state` branch.
  The claim contains only edition/status/timestamps, never credentials or an
  email address. It is not published to the Pages branch.
- A completed edition is skipped on retries. An uncertain SMTP result remains
  `sending` and stops automatic resend; inspect the original run before any
  operator reset. SMTP acceptance is not proof of inbox receipt.

## The outstanding service requirement

A repository administrator must restore the suspended execution service using
an authenticated GitHub session. The currently connected GitHub tool supports
repository/code changes but exposes no Actions-permission update operation;
the available browser session is signed out. The date-locked recovery branch
is prepared but has not run or sent mail.

To avoid relying on future manual re-enablement of a fork, use a standalone
repository or an independently hosted runner/scheduler with monitoring. This
needs one-time account/service setup and secret provisioning; existing GitHub
secret values cannot be read back for migration. Keep the original repository
and its history while preparing any migration. Do not detach/delete a fork
without explicit approval: GitHub documents permanent loss of associated
repository metadata when leaving the fork network.
