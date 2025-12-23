---
type: execution-plan
created: 2024-12-22
source: Supabase Integration and Authentication
strategy: segmented
estimated_tasks: 12
estimated_time: 4-6 hours
---

<objective>
Integrate Supabase as the database backend and implement authentication using Supabase Auth.
This enables managed PostgreSQL hosting, built-in user authentication, and prepares the application for production deployment.
</objective>

<execution_context>
Files to load before executing:
- execute-phase.md - Execution protocol and deviation rules
- checkpoints.md - Checkpoint handling
</execution_context>

<context>
Domain and codebase context needed:
- BRIEF.md - Project overview
- divination_api/pom.xml - Backend dependencies (Supabase Java client already added)
- divination_engine/package.json - Frontend dependencies
- docker-compose.yml - Container configuration
</context>

<current_state>
## What's Already Done:
- ✅ Backend renamed from `divination/` to `divination_api/`
- ✅ `pom.xml` has Supabase Java client dependency
- ✅ `docker-compose.yml` updated to use `divination_api` context
- ✅ `.gitignore` properly excludes `.env` files
- ✅ Backend structure exists with controllers, services, repositories, models

## What's Missing:
- ❌ Backend: No `SupabaseConfig.java` class
- ❌ Backend: No Spring Security configuration for JWT validation
- ❌ Backend: No `SUPABASE_URL`/`SUPABASE_KEY` in environment variables
- ❌ Backend: No `.env.example` file in `divination_api/`
- ❌ Frontend: No `@supabase/supabase-js` dependency
- ❌ Frontend: No Supabase client or auth service
- ❌ Docker: Missing `SUPABASE_URL`/`SUPABASE_KEY` in `docker-compose.yml`

## Architecture Decision:
Keep JPA repositories with Supabase PostgreSQL connection string (simplest migration path).
Use Supabase Auth for user authentication with JWT validation in Spring Security.
</current_state>

<tasks>

<!-- ============================================ -->
<!-- PHASE 1: Environment Configuration           -->
<!-- ============================================ -->

<task id="01" type="auto">
  <title>Create Backend .env.example with Supabase Variables</title>
  <description>
  Create environment variable template for the backend with Supabase configuration.
  This replaces the legacy DB_URL/DB_USERNAME/DB_PASSWORD with Supabase connection string.
  </description>
  <requirements>
  - Include SUPABASE_URL and SUPABASE_KEY variables
  - Include SUPABASE_DB_URL for JPA connection (Supabase PostgreSQL connection string)
  - Include SUPABASE_JWT_SECRET for JWT validation
  - Remove legacy DB_* variables
  - Document each variable with comments
  </requirements>
  <files>
  - `divination_api/.env.example` (new)
  </files>
  <verification>
  - File exists with all required variables
  - No actual secrets in the file
  </verification>
</task>

<task id="02" type="auto">
  <title>Update Frontend .env.example with Supabase Variables</title>
  <description>
  Add Supabase client configuration to the frontend environment template.
  </description>
  <requirements>
  - Add VITE_SUPABASE_URL variable
  - Add VITE_SUPABASE_ANON_KEY variable
  - Keep existing VITE_API_URL for backend API calls
  </requirements>
  <files>
  - `divination_engine/.env.example` (update)
  </files>
  <verification>
  - File includes Supabase variables with VITE_ prefix
  </verification>
</task>

<task id="03" type="auto">
  <title>Update docker-compose.yml with Supabase Environment Variables</title>
  <description>
  Update Docker configuration to pass Supabase variables to both services.
  Remove legacy PostgreSQL variables that are no longer needed.
  </description>
  <requirements>
  - Add SUPABASE_URL, SUPABASE_KEY, SUPABASE_JWT_SECRET to backend service
  - Add VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY to frontend service
  - Replace DB_URL with SUPABASE_DB_URL
  - Remove DB_USERNAME, DB_PASSWORD, DB_DRIVER (connection string includes credentials)
  </requirements>
  <files>
  - `docker-compose.yml` (update)
  </files>
  <verification>
  - docker-compose config validates without errors
  </verification>
</task>

<task id="04" type="checkpoint:human-verify">
  <title>Checkpoint: Verify Environment Configuration</title>
  <description>
  Pause to verify environment configuration is correct before proceeding.
  </description>
  <verification_question>
  Have you created a Supabase project and obtained the URL, anon key, and JWT secret?
  </verification_question>
  <verification_criteria>
  - Supabase project exists
  - Connection string available from Supabase dashboard
  - Anon key and JWT secret obtained
  - Local .env files created from .env.example templates
  </verification_criteria>
</task>

<!-- ============================================ -->
<!-- PHASE 2: Backend Supabase Configuration      -->
<!-- ============================================ -->

<task id="05" type="auto">
  <title>Update application.properties for Supabase Database</title>
  <description>
  Update Spring Boot configuration to use Supabase PostgreSQL connection.
  </description>
  <requirements>
  - Use SUPABASE_DB_URL environment variable for datasource
  - Connection string includes username/password (no separate variables needed)
  - Keep JPA/Hibernate configuration
  - Add Supabase-specific properties
  </requirements>
  <files>
  - `divination_api/src/main/resources/application.properties` (update)
  </files>
  <verification>
  - Application can connect to Supabase PostgreSQL
  </verification>
</task>

<task id="06" type="auto">
  <title>Add Spring Security OAuth2 Resource Server Dependency</title>
  <description>
  Add Spring Security dependencies for JWT validation.
  </description>
  <requirements>
  - Add spring-boot-starter-security
  - Add spring-boot-starter-oauth2-resource-server
  - These enable JWT validation for Supabase Auth tokens
  </requirements>
  <files>
  - `divination_api/pom.xml` (update)
  </files>
  <verification>
  - mvn clean compile succeeds
  </verification>
</task>

<task id="07" type="auto">
  <title>Create SecurityConfig for JWT Validation</title>
  <description>
  Configure Spring Security to validate Supabase JWT tokens.
  Public endpoints (cards, readings) remain accessible.
  Protected endpoints require valid JWT.
  </description>
  <requirements>
  - Configure JWT decoder with Supabase JWKS endpoint
  - Allow public access to GET endpoints for cards and readings
  - Require authentication for POST/PUT/DELETE operations
  - Configure CORS for frontend access
  - Disable CSRF for stateless API
  </requirements>
  <files>
  - `divination_api/src/main/java/com/divinationengine/divination/config/SecurityConfig.java` (new)
  </files>
  <verification>
  - Application starts without security errors
  - Public endpoints accessible without token
  - Protected endpoints return 401 without token
  </verification>
</task>

<task id="08" type="checkpoint:human-verify">
  <title>Checkpoint: Verify Backend Supabase Connection</title>
  <description>
  Verify the backend can connect to Supabase and JWT validation works.
  </description>
  <verification_question>
  Can the backend connect to Supabase PostgreSQL and validate JWTs?
  </verification_question>
  <verification_criteria>
  - Backend starts without errors
  - GET /api/cards returns data from Supabase
  - POST endpoints return 401 without valid JWT
  </verification_criteria>
</task>

<!-- ============================================ -->
<!-- PHASE 3: Frontend Supabase Integration       -->
<!-- ============================================ -->

<task id="09" type="auto">
  <title>Install Supabase JavaScript Client</title>
  <description>
  Add the Supabase client library to the frontend.
  </description>
  <requirements>
  - Install @supabase/supabase-js package
  - Use pnpm for package management
  </requirements>
  <files>
  - `divination_engine/package.json` (update via pnpm install)
  </files>
  <verification>
  - Package installed successfully
  - pnpm build succeeds
  </verification>
</task>

<task id="10" type="auto">
  <title>Create Supabase Client Service</title>
  <description>
  Create a TypeScript service to initialize and export the Supabase client.
  </description>
  <requirements>
  - Initialize client with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
  - Export typed client instance
  - Handle missing environment variables gracefully
  </requirements>
  <files>
  - `divination_engine/src/services/supabase.ts` (new)
  </files>
  <verification>
  - TypeScript compiles without errors
  - Client initializes when env vars are set
  </verification>
</task>

<task id="11" type="auto">
  <title>Create Auth Service with Login/Signup/Logout</title>
  <description>
  Create authentication service using Supabase Auth.
  </description>
  <requirements>
  - Implement signUp(email, password) function
  - Implement signIn(email, password) function
  - Implement signOut() function
  - Implement getCurrentUser() function
  - Implement onAuthStateChange() listener
  - Export auth types for TypeScript
  </requirements>
  <files>
  - `divination_engine/src/services/auth.ts` (new)
  - `divination_engine/src/types/auth.ts` (new)
  </files>
  <verification>
  - TypeScript compiles without errors
  - Auth functions are properly typed
  </verification>
</task>

<task id="12" type="auto">
  <title>Update API Service to Include Auth Token</title>
  <description>
  Modify the existing API service to include Supabase JWT in requests.
  </description>
  <requirements>
  - Get current session from Supabase client
  - Add Authorization header with Bearer token to protected requests
  - Handle token refresh automatically
  - Keep public endpoints working without token
  </requirements>
  <files>
  - `divination_engine/src/services/api.ts` (update)
  </files>
  <verification>
  - API calls include auth header when user is logged in
  - Public endpoints still work without auth
  </verification>
</task>

</tasks>

<verification>
Before marking this plan complete, verify:
- Backend connects to Supabase PostgreSQL successfully
- JWT validation works for protected endpoints
- Frontend can sign up, log in, and log out
- Authenticated API calls include valid JWT
- docker-compose up works with Supabase configuration
</verification>

<success_criteria>
This plan is successful when:
- Users can create accounts via Supabase Auth
- Users can log in and receive valid JWT
- Protected API endpoints validate JWT correctly
- Frontend stores and uses auth state properly
- All existing functionality continues to work
</success_criteria>

<deviation_rules>
- If Supabase Java client has issues, fall back to direct PostgreSQL connection with manual JWT validation
- If Spring Security OAuth2 Resource Server doesn't work with Supabase, implement custom JWT filter
- Frontend auth can be implemented incrementally - start with login/logout, add signup later
</deviation_rules>
