package com.watsch.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Env")
public class EnvPlugin extends Plugin {
    @PluginMethod
    public void getEnvVariables(PluginCall call) {
        // DO NOT hardcode API keys here. Load them securely at runtime.
        call.resolve(
            new com.getcapacitor.JSObject()
                .put("TMDB_API_KEY", "REPLACE_WITH_SECURE_RUNTIME_VALUE")
                .put("OPENAI_API_KEY", "REPLACE_WITH_SECURE_RUNTIME_VALUE")
        );
    }
} 