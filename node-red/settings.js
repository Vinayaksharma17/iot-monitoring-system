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
  
  // Uncomment the following to enable security
  // adminAuth: {
  //   type: "credentials",
  //   users: [{
  //     username: "admin",
  //     password: "$2a$08$zZWtXTja0fB1pzD4sHCMyOCMYz2Z6dNbM6tl8sJogENOMcxWV9DN.",
  //     permissions: "*"
  //   }]
  // },
  
  // ==========================================
  // Additional Settings
  // ==========================================
  
  // Timeout for HTTP request nodes (milliseconds)
  httpRequestTimeout: 120000,
  
  // Maximum message size (bytes)
  apiMaxLength: '5mb',
  
  // Disable Node-RED editor (set to true in production)
  disableEditor: false,
  
  // Enable verbose logging
  verbose: false
}
