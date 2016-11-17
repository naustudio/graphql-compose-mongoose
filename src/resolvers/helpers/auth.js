/* © 2016 NauStud.io
 * @author Quy Tran
 */
const makeProtection = function makeProtection(func) {
	return function (resolveParams) {
			const context = resolveParams.context;
			const promise = new Promise(function (resolve, reject) {
				if (context && context.authorize) {
					const authorizePromise = context.authorize(resolveParams);
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
