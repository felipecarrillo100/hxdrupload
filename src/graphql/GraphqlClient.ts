import {AppSettings} from "../settings/AppSettings";
import {ApolloClient, HttpLink, InMemoryCache, InMemoryCacheConfig} from "@apollo/client";
import introspection from "./introspection";

import fetch2  from "cross-fetch";

function fetch(a,b) {
    // console.log(a);
    // console.log(b);
    return fetch2(a,b);
}

const uri = `${AppSettings.HxDRServer}/graphql`; // <-- add the URL of the GraphQL server here


export const CacheSettings:  InMemoryCacheConfig = {
    addTypename: true,
    possibleTypes: introspection.possibleTypes,
}

export function CreateClient() {
    const token = AppSettings.getToken()
    const client = new ApolloClient({
        link: new HttpLink({ uri,
            headers: {
                "Authorization": "Bearer " + token
            },
            fetch: fetch as any
        }),
        cache: new InMemoryCache(CacheSettings),
    });
    return client;
}
