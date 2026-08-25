Build the project-management application inspired by Nulab Backlog using a strict phase-by-phase implementation approach.

The objective is to eventually reproduce the major functionality of Backlog, but development must be incremental. Do not attempt to implement everything in one phase.

The application must remain functional after every phase.

GENERAL RULES

- Inspect the existing codebase before making changes.
- Reuse the existing technology stack where reasonable.
- Do not rewrite the entire application unless necessary.
- Keep the architecture modular and extensible.
- Use local-first persistence.
- Do not require a cloud backend for the initial implementation.
- Do not add fake/mock functionality that appears usable but does nothing.
- Every completed phase must leave the application runnable.
- Before moving to the next phase, verify that existing functionality still works.
- Keep storage, business logic, and UI separated.
- Design interfaces/services so local storage can later be replaced with a remote backend.
- Do not copy Backlog branding, logos, proprietary assets, or exact visual design.
- Use Backlog only as functional and information-architecture inspiration.


PHASE 0 — EXISTING PROJECT AUDIT

Before implementing features:

- Inspect the entire existing project structure.
- Identify:
  - Framework
  - Language
  - Build system
  - Existing UI library
  - Existing database/storage
  - Routing
  - Authentication
  - API layer
  - State management
  - Testing setup
- Determine what can be reused.
- Identify architectural problems that could prevent the later phases.
- Propose the target architecture.

Do not implement major features yet.

Output a short technical assessment and implementation plan.


PHASE 1 — APPLICATION FOUNDATION

Create the basic application shell.

Implement:

- Application routing
- Main layout
- Sidebar
- Top navigation
- User menu
- Responsive layout
- Basic dashboard page
- Project navigation
- Settings navigation
- Error states
- Loading states
- Empty states
- Basic reusable UI components

Create the initial application structure for:

- Dashboard
- Projects
- Issues
- Wiki
- Files
- Repository
- Members
- Settings

At this stage, pages can contain proper empty states, but navigation must work.

Acceptance Criteria:

- Application starts successfully.
- All major navigation routes work.
- No broken links.
- Responsive layout works.
- Architecture is ready for feature implementation.


PHASE 2 — LOCAL PERSISTENCE LAYER

Implement the local-first storage architecture.

Create a proper persistence abstraction rather than allowing UI components to directly manipulate storage.

For example:

- UserRepository
- ProjectRepository
- IssueRepository
- FileRepository
- WikiRepository
- RepositoryRepository

Create a storage/service layer that can later support:

- Local database
- PostgreSQL
- MySQL
- Supabase
- Firebase
- Custom API

The initial implementation should use local persistence.

Requirements:

- Data survives application restart.
- Data can be created/read/updated/deleted.
- Storage errors are handled properly.
- Include a development/reset mechanism for clearing local data.

Do not implement the full feature set yet.


PHASE 3 — USERS & AUTHENTICATION

Implement local user management.

Features:

- Register/create user
- Login
- Logout
- Session persistence
- User profile
- Avatar/profile information
- Basic account settings
- Password handling appropriate for the chosen local architecture

Create authentication services/interfaces so authentication can later be replaced with a server-based implementation.

Acceptance Criteria:

A user can:

- Create an account.
- Log in.
- Close/restart the application.
- Remain authenticated where appropriate.
- Log out.
- Edit profile information.


PHASE 4 — PROJECTS

Implement project management.

Features:

- Create project
- Edit project
- Delete/archive project
- Project list
- Project dashboard
- Project description
- Project key/identifier
- Project settings
- Project members
- Project roles
- Project activity

Project navigation should dynamically update based on the selected project.

Example:

Projects → My Project → Issues / Board / Files / Wiki / Repository / Members / Settings


PHASE 5 — ISSUES / TICKETS

This is the core functionality.

Implement:

- Create issue
- Edit issue
- Delete issue
- Issue detail page
- Issue title
- Description
- Assignee
- Reporter
- Status
- Priority
- Due date
- Start date
- Category
- Labels
- Milestone/version
- Attachments
- Comments
- Activity/history

Create issue IDs/keys such as:

- PROJECT-1
- PROJECT-2
- PROJECT-3

Issue changes should be tracked in activity history.


PHASE 6 — ISSUE MANAGEMENT & WORKFLOW

Expand the issue system.

Implement:

- Issue list
- Search
- Filtering
- Sorting
- Pagination
- Saved filters where practical
- Bulk actions
- Status workflow
- Custom statuses
- Priority management
- Categories
- Labels
- Milestones/versions
- Due-date filtering
- Assignee filtering

Create a configurable workflow system.

Example:

Open → In Progress → Resolved → Closed

The architecture should allow additional statuses later.


PHASE 7 — KANBAN / BOARD

Implement a project issue board.

Features:

- Columns based on statuses
- Drag-and-drop issues
- Move issue between statuses
- Issue cards
- Assignee display
- Priority display
- Labels
- Due dates
- Quick issue creation

When an issue is moved to another column, its status must actually update in persistence.

The board and issue list must use the same underlying issue data.


PHASE 8 — COMMENTS, ACTIVITY & NOTIFICATIONS

Implement collaboration features.

COMMENTS

- Add comment
- Edit comment
- Delete comment
- Comment timestamps
- User attribution

ACTIVITY

Track:

- Issue created
- Issue updated
- Status changed
- Assignee changed
- Priority changed
- Comment added
- File uploaded
- Issue deleted
- Other important project actions

NOTIFICATIONS

Create an internal notification system.

Examples:

- Issue assigned to you
- Someone commented on your issue
- Someone mentioned you
- Issue status changed
- Due date approaching

Notifications should be persistent.


PHASE 9 — FILE MANAGEMENT

Implement project file management similar to Backlog's file functionality.

Features:

- File browser
- Folder creation
- Folder navigation
- File upload
- File download
- Rename
- Delete
- Move
- File metadata
- File size
- Upload date
- Uploaded by
- Attach files to issues

Store files locally.

Use a storage abstraction:

FileStorageProvider

Initial implementation:

LocalFileStorageProvider

Future implementations may include:

- S3FileStorageProvider
- CloudStorageProvider

Do not tightly couple the application to the local filesystem.


PHASE 10 — WIKI / DOCUMENTATION

Implement project wiki functionality.

Features:

- Create page
- Edit page
- Delete page
- Page hierarchy
- Markdown/rich-text support
- Search wiki pages
- Page history
- Last modified information
- Author information
- Attachments where practical

Wiki data should be locally persistent.


PHASE 11 — REPOSITORY / GIT

Implement local Git repository functionality.

First create an abstraction:

RepositoryProvider

Then implement:

LocalGitRepositoryProvider

Features:

- Connect/open local Git repository
- Repository overview
- Branch list
- Commit history
- Commit details
- Changed files
- Diff viewer
- File browser
- Basic repository metadata

If the environment allows safe Git operations, support:

- Initialize repository
- Create branch
- Switch branch
- Commit
- View status

Do not require GitHub yet.


PHASE 12 — GITHUB INTEGRATION

After local Git functionality works, design GitHub integration.

Create:

GitHubRepositoryProvider

Investigate the appropriate GitHub API/authentication approach.

Potential features:

- Connect GitHub account
- Select repository
- Display repository information
- Branches
- Commits
- Pull requests
- Issues synchronization where practical
- Repository activity

Do not make GitHub a hard dependency.

The application must continue working completely with local repositories.

If GitHub requires a backend/server for secure authentication or webhooks, clearly separate those requirements from the local-first implementation.


PHASE 13 — SEARCH

Implement global and project-level search.

Search across:

- Issues
- Comments
- Wiki pages
- Files
- Projects
- Users
- Repository content where practical

Support:

- Keyword search
- Filters
- Project filtering
- Type filtering
- Status filtering
- Assignee filtering

Design the search service so it can later be replaced by:

- Elasticsearch
- Meilisearch
- PostgreSQL full-text search
- Another search engine


PHASE 14 — DASHBOARD & REPORTS

Create useful project dashboards.

Include:

- Open issues
- Closed issues
- Issues by status
- Issues by priority
- Issues by assignee
- Overdue issues
- Recent activity
- Recent commits
- Project progress
- Milestone progress

Add basic charts/visualizations where appropriate.

All statistics must use actual persisted application data.


PHASE 15 — PERMISSIONS & ROLES

Implement proper authorization.

Example roles:

- Project Administrator
- Manager
- Developer
- Reporter
- Viewer

Permissions should control:

- Project management
- Issue creation
- Issue editing
- Issue deletion
- File management
- Wiki management
- Repository access
- Member management
- Project settings

Do not rely only on hiding UI buttons.

Authorization must also exist at the service/data layer.


PHASE 16 — BACKLOG FEATURE EXPANSION

Once the core application is stable, compare the implementation against the major functionality available in Backlog.

Identify missing functionality and implement it incrementally.

Possible areas include:

- Advanced issue relationships
- Parent/child issues
- Milestones
- Versions
- Custom fields
- Advanced workflows
- Git integration
- Pull requests
- Code review
- Advanced notifications
- Email notifications
- Webhooks
- Project templates
- Advanced reports
- Time tracking
- Project activity
- Advanced permissions
- API
- Import/export
- Automation

Do not add features blindly.

First determine whether they fit the application's architecture.


PHASE 17 — API / BACKEND READINESS

Prepare the application for eventual server deployment.

Create clear interfaces between:

UI → Application Services → Repositories → Storage

The local implementation should be replaceable with:

UI → API Client → Backend → Database/File Storage

without rewriting the UI.

Document:

- Data models
- API requirements
- Authentication requirements
- File-storage requirements
- Repository integration requirements
- GitHub integration requirements


PHASE 18 — TESTING & STABILIZATION

Before considering the project complete:

Implement tests for critical functionality.

Prioritize:

- Authentication
- Projects
- Issues
- Issue workflow
- Comments
- File management
- Wiki
- Permissions
- Persistence
- Repository functionality

Also perform:

- UI testing
- Error handling
- Empty-state testing
- Loading-state testing
- Persistence testing
- Restart testing
- Responsive testing

Fix regressions before adding additional features.


PHASE 19 — UI/UX CUSTOMIZATION

Only after the major functionality is stable should we customize the application.

At this stage:

- Improve visual design
- Customize colors
- Customize typography
- Improve navigation
- Improve dashboard
- Improve issue views
- Improve board
- Improve file manager
- Improve wiki
- Improve repository UI
- Add branding
- Improve animations/interactions
- Improve accessibility

The application should now have the functionality we need, allowing customization without constantly changing the underlying architecture.


PHASE COMPLETION RULE

After every phase:

1. Run/build the application.
2. Verify the newly implemented functionality.
3. Verify previous phases still work.
4. Fix errors/regressions.
5. Summarize what was implemented.
6. List files/components/services created or modified.
7. List any architectural decisions.
8. List anything intentionally deferred.
9. Only then proceed to the next phase.

Do not automatically jump through all phases in one response or one implementation.

Start with PHASE 0.

After Phase 0 is completed, wait for confirmation before implementing Phase 1.


OVERALL GOAL

Backlog-like functionality
→ local-first storage
→ modular architecture
→ optional GitHub integration
→ optional backend
→ customization later.
