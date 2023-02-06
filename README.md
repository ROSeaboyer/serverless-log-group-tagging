# serverless-log-group-tagging
Add tags to cloudwatch logs for serverless functions, as well as API Gateway logging.

## Global Tags
To define tags for all function logs, as well as for your API Gateways, use the syntax below:
```yml
custom:
  commonTags: # These tags are applied to all supported log groups (overridden by individually-specified tags in the below sections or with a function directly)
    tagKey: tagValue
  restApiTags: # Corresponds to API Gateway defined in serverless with provider.restApi
    tagKey: tagValue
  httpApiTags: # Corresponds to API Gateway defined in serverless with provider.httpApi
    tagKey: tagValue
  websocketTags: # Corresponds to API Gateway defined in serverless with provider.websocket
    tagKey: tagValue
  includeProviderTags: true # Applies all tags listed in provider.tags to all supported log groups (overridden by commonTags specified above)
```

## Per-function tags
To have custom tags for a log group associated with a specific function, that's done as follows:
```yml
functions:
  functionName:
    logs:
      tags:
        tagKey: tagValue
```