/**
 * Node-RED Settings Configuration
 * For IoT Monitoring System - Sensor Data Simulation
 */

module.exports = {
  // ==========================================
  // Flow Configuration
  // ==========================================
  
  // The file containing the flows
  flowFile: 'flows.json',
  
  // User directory for Node-RED data
  userDir: '/data',
  
  // Directory for loading additional nodes
  nodesDir: '/data/nodes',
  
  // ==========================================
  // Editor Theme Configuration
  // ==========================================
  
  editorTheme: {
    projects: {
      enabled: false
    },
    palette: {
      editable: true,
      catalogues: [
        'https://catalogue.nodered.org/catalogue.json'
      ]
    }
  },
  
  // ==========================================
  // Logging Configuration
  // ==========================================
  
  logging: {
    console: {
      level: 'info',
      metrics: false,
      audit: false
    }
  },
  
  // ==========================================
  // Function Node Configuration
  // ==========================================
  
  // Context available to function nodes
  functionGlobalContext: {
    // Add global variables here if needed
  },
  
  // Enable loading of external npm modules in function nodes
  functionExternalModules: true,
  
  // ==========================================
  // Context Storage Configuration
  // ==========================================
  
  contextStorage: {
    default: {
      module: 'memory'
    },
    file: {
      module: 'localfilesystem'
    }
  },
  
  // ==========================================
  // HTTP Configuration
  // ==========================================
  
  // Root path for the Node-RED editor
  httpAdminRoot: '/admin',
  
  // Root path for HTTP nodes
  httpNodeRoot: '/',
  
  // ==========================================
  // Dashboard Configuration
  // ==========================================
  
  ui: {
    path: 'ui'
  },
  
  // ==========================================
  // Security Configuration
  // ==========================================

  // The editor must never be reachable without authentication. Credentials
  // are supplied at runtime via environment variables so no secret is ever
  // committed:
  //   NODE_RED_ADMIN_USER           (default: "admin")
  //   NODE_RED_ADMIN_PASSWORD_HASH  bcrypt hash (see deploy/generate-env.sh)
  // When the hash is missing the login can never succeed, which fails safe
  // (the editor stays inaccessible) rather than opening up.
  adminAuth: {
    type: 'credentials',
    users: [
      {
        username: process.env.NODE_RED_ADMIN_USER || 'admin',
        password: process.env.NODE_RED_ADMIN_PASSWORD_HASH,
        permissions: '*'
      }
    ]
  },

  // Encrypts stored credentials (e.g. the flows_cred.json file). Set from the
  // environment so the key does not live in the image or in this file.
  // Generate with: openssl rand -hex 32
  credentialSecret: process.env.NODE_RED_CREDENTIAL_SECRET,
  
  // ==========================================
  // Additional Settings
  // ==========================================
  
  // Timeout for HTTP request nodes (milliseconds)
  httpRequestTimeout: 120000,
  
  // Maximum message size (bytes)
  apiMaxLength: '5mb',
  
  // Editor stays enabled but is only reachable over the private Tailscale
  // network (never through the public reverse proxy). Set
  // NODE_RED_DISABLE_EDITOR=true to run the committed flows read-only instead.
  disableEditor: process.env.NODE_RED_DISABLE_EDITOR === 'true',
  
  // Enable verbose logging
  verbose: false
}
