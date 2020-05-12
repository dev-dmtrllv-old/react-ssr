import React from "react";
import { Router, Link, Route, Redirect } from "ssr/router";
import { Dynamic } from "ssr/async";
import { api } from "api";

const Page: React.FC<{ exact: boolean, path?: string, page: string, title?: string }> = ({ exact, path, page, title }) =>
{
	return (
		<Route exact={exact} path={path || `/${page}`} title={title}>
			<Dynamic import={() => import(`./pages/${page}`)} path={`./${page}`}>
				{({ Component, error }) => 
				{
					if (Component)
						return <Component />;
					return null;
				}}
			</Dynamic>
		</Route>
	)
}

if(env.isClient)
	api.users.get().then(r => console.log(r.users));

export default () =>
{
	return (
		<Router>
			<Link to="/home">Home</Link>
			<Link to="/test">Test</Link>
			<Route path="/home"><h1>Home</h1></Route>
			<Route path="/test">
				<Router base="/test">
					<h1>Test</h1>
					<br />
					<Link to="/1">1</Link>
					<Link to="/2">2</Link>
					<Page exact page="1" title="111"/>
					<Page exact page="2" />
				</Router>
			</Route>
			<Redirect exact from="/" to="/home" />
		</Router>
	);
};