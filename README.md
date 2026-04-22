# ceresa-frontend

---

### CETEIcean Preview Deployment (WebDAV)

This repository includes a GitHub Actions workflow that deploys a live preview of the CETEIcean-based HTML rendering to a WebDAV endpoint.

#### Purpose

The workflow makes the most recent version of the CETEIcean-based transformation layer available as a static preview, linked in the [oXygen framework](https://github.com/DHBern/ceresa-oxygen-framework/).

Running the preview on WebDAV has the advantage that all files are served from the same origin and no CORS issues occur.

In contrast to this, developing the preview code is much more ergonomically here than directly on WebDAV.

#### Behavior

* Triggered on every push and via manual execution (`workflow_dispatch`)
* Checks for changes in:

  ```
  src/lib/CETEIcean
  ```
* If no changes are detected, the workflow exits without performing any deployment
* If changes are detected:

  * Synchronizes the directory contents to the WebDAV target:

    ```
    preview/
    ```
  * Logs all synchronised changes at:

    ```
    preview/logs
    ```
    
    <details><summary><h4>Logging format</h4></summary>
    
    * timestamp (UTC)
    * commit hash (short)
    * author
    * list of changed files (A/M/D)
    
    </details>

<details><summary><h4>Configuration</h4></summary>

The workflow requires the following repository secrets:

* `WEBDAV_URL`
* `WEBDAV_USERNAME`
* `WEBDAV_PASSWORD`

#### Technical Notes

* File synchronization is performed using `rclone` with WebDAV support
* The target directory is kept in sync (including deletions)
* The update log provides a minimal audit trail of preview deployments

</details>

---

