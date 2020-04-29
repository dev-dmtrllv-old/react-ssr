import React from "react";
import { Router, Link, Route, Redirect } from "ssr/router";

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
					<br/>
					<Link to="/cat">Cat</Link>
					<Link to="/dog">Dog</Link>
					<Route exact path="/cat"><h1>Cat</h1></Route>
					<Route exact path="/dog"><h1>Dog</h1></Route>
				</Router>
			</Route>
			<Redirect exact from="/" to="/home" />
		</Router>
	);
};