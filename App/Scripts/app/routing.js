ui.routing = {};

// Parse path parameters according to route pattern
ui.routing.parseParams = (pattern, path) => {
    // Convert route pattern to regex
    const optionalParamRegex = /:([^\/?]+)\?/g;
    const requiredParamRegex = /:([^\/?]+)/g;
    const wildcardRegex = /\*/g;
    
    // Handle optional parameters first
    let regexPattern = pattern
        .replace(optionalParamRegex, '(?:\/([^/]+))?')
        .replace(requiredParamRegex, '\/([^/]+)')
        .replace(wildcardRegex, '(.*)'); 
    
    // Add start/end markers and handle empty segments
    regexPattern = `^${regexPattern}$`;
    
    // Create regex object
    const regex = new RegExp(regexPattern);
    
    // Extract parameter names from pattern
    const paramNames = [];
    let match;
    
    // Extract optional param names
    while ((match = optionalParamRegex.exec(pattern)) !== null) {
        paramNames.push(match[1]);
    }
    
    // Reset and extract required param names
    requiredParamRegex.lastIndex = 0;
    while ((match = requiredParamRegex.exec(pattern)) !== null) {
        paramNames.push(match[1]);
    }
    
    // Add wildcard param if present
    if (pattern.includes('*')) {
        paramNames.push('wildcard');
    }
    
    // Test if path matches the pattern
    const pathMatch = regex.exec(path);
    
    if (!pathMatch) {
        return null; // No match
    }
    
    // Extract parameter values
    const params = {};
    for (let i = 0; i < paramNames.length; i++) {
        params[paramNames[i]] = pathMatch[i + 1] || null; // +1 because first match is the full string
    }
    
    return params;
};

// Find matching route and extract params
ui.routing.get = (path) => {
    // Normalize path by removing leading/trailing slashes
    const normalizedPath = path.replace(/^\/+|\/+$/g, '');
    
    for (const route of ui.routes) {
        const normalizedPattern = route.path.replace(/^\/+|\/+$/g, '');
        const params = ui.routing.parseParams(normalizedPattern, normalizedPath);
        
        if (params !== null) {
            return {
                route: route,
                params: params
            };
        }
    }
    
    // Find wildcard route as fallback
    const wildcardRoute = ui.routes.find(route => route.path === '*');
    return wildcardRoute ? { route: wildcardRoute, params: {} } : null;
};

// Execute a route with the given path
ui.routing.execute = (path) => {
    const result = ui.routing.get(path);
    
    if (result) {
        result.route.action(result.params);
        return true;
    }
    
    return false;
};

// Extract path from URL
ui.routing.getPathFromUrl = () => {
    // Get the current URL path
    const fullPath = window.location.pathname;
    
    // Check if the path starts with /dashboard/
    if (fullPath.startsWith('/dashboard/')) {
        // Extract the part after /dashboard/
        return fullPath.substring('/dashboard/'.length);
    }
    
    // If not in dashboard, return the path as is (without leading slash)
    return fullPath.startsWith('/') ? fullPath.substring(1) : fullPath;
};

// Initialize routing
ui.routing.init = () => {
    // Handle initial route
    const initialPath = ui.routing.getPathFromUrl();
    if (initialPath) {
        ui.routing.execute(initialPath);
    }
    
    // Listen for popstate events (back/forward browser buttons)
    window.addEventListener('popstate', (event) => {
        const path = ui.routing.getPathFromUrl();
        ui.routing.execute(path);
    });
    
    // Listen for hash changes
    window.addEventListener('hashchange', () => {
        const path = ui.routing.getPathFromUrl();
        ui.routing.execute(path);
    });
    
    // Create a proxy for history.pushState and history.replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    // Override pushState
    history.pushState = function() {
        originalPushState.apply(this, arguments);
        // Dispatch a custom event
        window.dispatchEvent(new Event('locationchange'));
    };
    
    // Override replaceState
    history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        // Dispatch a custom event
        window.dispatchEvent(new Event('locationchange'));
    };
    
    // Listen for our custom locationchange event
    window.addEventListener('locationchange', () => {
        const path = ui.routing.getPathFromUrl();
        ui.routing.execute(path);
    });
};

// Call init when the DOM is loaded
document.addEventListener('DOMContentLoaded', ui.routing.init);