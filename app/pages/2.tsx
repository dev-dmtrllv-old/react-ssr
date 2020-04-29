import React from "react";
import { api } from "api";
import { jsx } from "utils";

import "../test.scss";

export default () => (
	<api.users2.get.Component>
		{({ data, error, isLoading }) => 
		{
			if (data)
				return jsx.map(data.users, ({ name, age }, i) => <span key={i}>{i}: {name} - {age}<br/></span>)
			return null;
		}}
	</api.users2.get.Component>
);