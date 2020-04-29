import React from "react";
import { api } from "api";
import { jsx } from "utils";

import "../test.scss";

export default () => (
	<api.users.get.Component>
		{({ data, error, isLoading }) => 
		{
			if(isLoading)
				return <h1>Loading</h1>;
			if (data)
				return jsx.map(data.users, ({ name, age }, i) => <span key={i}>{i}: {name} - {age}<br/></span>)
			return null;
		}}
	</api.users.get.Component>
);