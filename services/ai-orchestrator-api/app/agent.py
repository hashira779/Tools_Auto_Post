import json
import requests
from typing import List, Dict, Any
from .tools import TOOLS_REGISTRY

class Agent:
    def __init__(self, ollama_url: str, model: str = "llama3.2"):
        self.ollama_url = ollama_url
        self.model = model

    def _build_system_prompt(self) -> str:
        tools_desc = []
        for name, config in TOOLS_REGISTRY.items():
            schema = config["schema"].schema()
            tools_desc.append({
                "name": name,
                "description": config["description"],
                "parameters": schema["properties"]
            })
            
        return f"""You are CAMTECH AI, a highly intelligent and capable assistant.
You have access to the following tools:
{json.dumps(tools_desc, indent=2)}

If you need to use a tool, you MUST output a JSON object exactly like this and NOTHING else:
{{"tool": "tool_name", "kwargs": {{"param1": "value1"}}}}

If you are just talking to the user or providing the final answer after using tools, just write text normally. Do not use JSON formatting unless calling a tool.
"""

    def chat(self, messages: List[Dict[str, str]], max_loops: int = 5):
        """
        Executes the ReAct loop.
        Messages is a list of {"role": "...", "content": "..."}
        Returns a generator yielding string chunks (for SSE).
        """
        system_msg = {"role": "system", "content": self._build_system_prompt()}
        current_messages = [system_msg] + messages
        
        loop_count = 0
        while loop_count < max_loops:
            loop_count += 1
            
            # Call Ollama
            try:
                response = requests.post(
                    f"{self.ollama_url}/api/chat",
                    json={
                        "model": self.model,
                        "messages": current_messages,
                        "stream": False # We don't stream the tool loop, only the final answer
                    },
                    timeout=60
                )
                response.raise_for_status()
                result = response.json()
                reply_content = result.get("message", {}).get("content", "").strip()
            except Exception as e:
                yield f"Error communicating with AI engine: {str(e)}"
                return

            # Check if the LLM wants to call a tool
            # A simple heuristic: if the message starts with { and has "tool", it's a tool call.
            try:
                if reply_content.startswith("{") and "tool" in reply_content:
                    tool_call = json.loads(reply_content)
                    tool_name = tool_call.get("tool")
                    tool_kwargs = tool_call.get("kwargs", {})
                    
                    if tool_name in TOOLS_REGISTRY:
                        # Yield a progress update so the frontend knows we are working
                        yield f"data: {json.dumps({'type': 'progress', 'content': f'Running {tool_name}...'})}\n\n"
                        
                        tool_func = TOOLS_REGISTRY[tool_name]["function"]
                        tool_result = tool_func(**tool_kwargs)
                        
                        # Add assistant's tool call intent and the tool's result to history
                        current_messages.append({"role": "assistant", "content": reply_content})
                        current_messages.append({
                            "role": "system", 
                            "content": f"Tool '{tool_name}' result:\n{tool_result}\nNow provide the final answer to the user based on this result."
                        })
                        continue # Loop back to let the LLM see the tool result
                    else:
                        yield f"data: {json.dumps({'type': 'error', 'content': f'Unknown tool {tool_name}'})}\n\n"
                        return
            except json.JSONDecodeError:
                pass # Not a tool call, just normal text
                
            # If we get here, it's not a tool call, so stream the final response
            # To actually stream the final response properly, we make a streaming call to Ollama
            current_messages.append({"role": "assistant", "content": ""}) # placeholder
            
            try:
                stream_response = requests.post(
                    f"{self.ollama_url}/api/chat",
                    json={
                        "model": self.model,
                        "messages": current_messages[:-1], # all except the empty placeholder
                        "stream": True
                    },
                    stream=True,
                    timeout=60
                )
                stream_response.raise_for_status()
                
                for line in stream_response.iter_lines():
                    if line:
                        data = json.loads(line.decode('utf-8'))
                        chunk = data.get("message", {}).get("content", "")
                        if chunk:
                            yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
                
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                return
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
                return
                
        yield f"data: {json.dumps({'type': 'error', 'content': 'Agent loop exceeded maximum iterations.'})}\n\n"
