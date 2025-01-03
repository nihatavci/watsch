package com.watsch.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Env")
public class EnvPlugin extends Plugin {
    @PluginMethod
    public void getEnvVariables(PluginCall call) {
        call.resolve(
            new com.getcapacitor.JSObject()
                .put("TMDB_API_KEY", "41fc3d91a9d40ec6ff07b82fae717127")
                .put("OPENAI_API_KEY", "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")
        );
    }
} 