/* © 2016 NauStud.io
 * @author Quy Tran
 */
const makeProtection = function makeProtection(func, context) {
	return function (resolveParams) {
			resolveParams.resolverInfo = context;
			const request = resolveParams.info.rootValue && resolveParams.info.rootValue.request;
			const promise = new Promise(function (resolve, reject) {
				if (request && request.authorize) {
					const authorizePromise = request.authorize(resolveParams);
					authorizePromise.then((passed) => {
						if (passed) {
							let result = func(resolveParams);
							result.then(function (value) {
									resolve(value);
								}).catch(function (err){
									reject(err);
								});
						} else {
							reject(JSON.stringify({
								message: 'Don\'t have permission',
								errorCode: 401,
							}));
						}
					});
				} else {
					let result = func(resolveParams);
					result.then(function (value) {
						resolve(value);
					}).catch(function (err) {
						reject(err);
					});
				}
			});
			return promise;
		};
};

module.exports.makeProtection = makeProtection;
