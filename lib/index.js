'use strict';
 
class ServerlessLogGroupTagging {
    constructor(serverless) {
        this.provider = serverless.getProvider('aws');
        this.serverless = serverless;

        const baseProperties = {
            type: "object",
            properties: {
                "logs": {
                    type: "object",
                    properties: {
                        tags: { $ref: '#/definitions/awsResourceTags' },
                    }
                }
            }
        }

        const customProperties = {
            type: "object",
            properties: {
                "logs": {
                    type: "object",
                    properties: {
                        "commonTags": { $ref: '#/definitions/awsResourceTags' },
                        "httpApiTags": { $ref: '#/definitions/awsResourceTags' },
                        "restApiTags": { $ref: '#/definitions/awsResourceTags' },
                        "websocketTags": { $ref: '#/definitions/awsResourceTags' },
                        "includeProviderTags": {type: "boolean"}
                    },
                    additionalProperties: false
                }
            }
        }

        serverless.configSchemaHandler.defineFunctionProperties("aws", baseProperties);
        serverless.configSchemaHandler.defineCustomProperties(customProperties);

        const getNestedObjectValue = (baseObject, pathArray) => {
            let nestedObject = baseObject
            for (const pathPart of pathArray) {
                if (!nestedObject[pathPart]) return {};
                nestedObject = nestedObject[pathPart];
            }
            return nestedObject;
        };

        const currentConfiguration = this.serverless.configurationInput;
        
        const handleLogGroupCreation = (tagObject, logicalName) => {
            const logGroupTags = Object.keys(tagObject).map(tagKey => {return {'Key': tagKey, 'Value': tagObject[tagKey]}});
            const logGroupObject = {
                Type: 'AWS::Logs::LogGroup',
                Properties: {
                    Tags: logGroupTags,
                    ...getNestedObjectValue(currentConfiguration, ['resources', 'Resources', logicalName, 'Properties'])
                }
            }
            this.serverless.extendConfiguration(['resources', 'Resources', logicalName], logGroupObject);
        }

        const providerTags = getNestedObjectValue(currentConfiguration, ['custom', 'logs', 'useProviderLogs']) ? currentConfiguration.provider.tags || {} : {};

        const allLogTags = { ...providerTags, ...getNestedObjectValue(currentConfiguration, ['custom', 'logs', 'commonTags'])};

        const providerLogs = currentConfiguration.provider.logs || {};
        const restApiTags = providerLogs.restApi ?
            {...allLogTags, ...getNestedObjectValue(currentConfiguration, ['custom', 'logs', 'restApiTags'])} : {};
        const httpApiTags = providerLogs.httpApi ?
            {...allLogTags, ...getNestedObjectValue(currentConfiguration, ['custom', 'logs', 'httpApiTags'])} : {};
        const websocketTags = providerLogs.websocket ?
            {...allLogTags, ...getNestedObjectValue(currentConfiguration, ['custom', 'logs', 'websocketTags'])} : {};

        // functions
        let functionTags;
        let logGroupResourceName;
        for (const functionLogicalName of Object.keys(currentConfiguration.functions || {})) {
            logGroupResourceName = functionLogicalName[0].toUpperCase() + functionLogicalName.slice(1) + 'LogGroup';
            functionTags = {...allLogTags, ...getNestedObjectValue(currentConfiguration.functions[functionLogicalName], ['logs', 'tags'])};
            handleLogGroupCreation(functionTags, logGroupResourceName);
        }

        if (providerLogs.httpApi) handleLogGroupCreation(httpApiTags, 'HttpApiLogGroup');
        if (providerLogs.restApi) handleLogGroupCreation(restApiTags, 'ApiGatewayLogGroup');
        if (providerLogs.websocket) handleLogGroupCreation(websocketTags, 'WebsocketsLogGroup');
    }
}
 
module.exports = ServerlessLogGroupTagging;
