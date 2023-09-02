import {AppSettings} from "../settings/AppSettings";
import {ApolloClient, HttpLink, InMemoryCache, InMemoryCacheConfig} from "@apollo/client";
import introspection from "../hxdrlib/introspection";
import {fetch} from "../fetchutils/fetch";

const uri = `${AppSettings.HxDRServer}/graphql`; // <-- add the URL of the GraphQL server here

export const CacheSettings:  InMemoryCacheConfig = {
    addTypename: true,
    possibleTypes: introspection.possibleTypes,
}

export function CreateClient() {
    const token = AppSettings.getToken()
    return new ApolloClient({
        link: new HttpLink({
            uri,
            headers: {
                "Authorization": "Bearer " + token
            },
            fetch
        }),
        cache: new InMemoryCache(CacheSettings),
    });
}
