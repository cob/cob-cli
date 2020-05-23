/* configuration file used for semantic-release */

const releaseRules = [
    { "type": "build", "release": "patch"},
    { "type": "ci", "release": "patch" },
    { "type": "chore", "release": "patch" },
    { "type": "docs", "release": "patch" },
    { "type": "refactor", "release": "patch" },
    { "type": "style", "release": "patch" },
    { "type": "test", "release": "patch" }
]

const transformCommitType = type => {
	const commitTypeMapping = {
		feat: "Features",
		fix: "Bug Fixes",
		perf: "Performance Improvements",
		revert: "Reverts",
		docs: "Documentation",
		style: "Styles",
		refactor: "Code Refactoring",
		test: "Tests",
		build: "Build System",
		ci: "Continuous Integration",
		chore: "Chores",
		default: "Miscellaneous"
	};
	return commitTypeMapping[type] || commitTypeMapping["default"];
};

const customTransform = (commit, context) => {
	const issues = [];

	// console.log("mimes debug: ",commit)
	// console.log("mimes debug: ",context)

	commit.notes.forEach(note => {
		note.title = `BREAKING CHANGES`;
	});

	commit.type = transformCommitType(commit.type);

	if (commit.scope === "*") {
		commit.scope = "";
	}

	if (typeof commit.hash === `string`) {
		commit.shortHash = commit.hash.substring(0, 7) ;

		if (commit.type === "Miscellaneous") {
			const date = new Date(commit.committerDate)
			const dateTimeFormat = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'numeric', day: '2-digit' }) 
			const [{ value: month },,{ value: day },,{ value: year }] = dateTimeFormat .formatToParts(date) 
	
			commit.shortHash = `${year}.${month}.${day}  ` + commit.shortHash ;
		}
	}

	if (typeof commit.subject === `string`) {
		let url = context.repository
			? `${context.host}/${context.owner}/${context.repository}`
			: context.repoUrl;
		if (url) {
			url = `${url}/issues/`;
			// Issue URLs.
			commit.subject = commit.subject.replace(/#([0-9]+)/g, (_, issue) => {
				issues.push(issue);
				return `[#${issue}](${url}${issue})`;
			});
		}
		if (context.host) {
			// User URLs.
			commit.subject = commit.subject.replace(
				/\B@([a-z0-9](?:-?[a-z0-9/]){0,38})/g,
				(_, username) => {
					if (username.includes("/")) {
						return `@${username}`;
					}

					return `[@${username}](${context.host}/${username})`;
				}
			);
		}
	}

	// remove references that already appear in the subject
	commit.references = commit.references.filter(reference => {
		if (issues.indexOf(reference.issue) === -1) {
			return true;
		}
		return false;
	});
	return commit;
};


const plugins = [
	[
		"@semantic-release/commit-analyzer",{
			"releaseRules": releaseRules
		}
	],
	["@semantic-release/release-notes-generator", {
		"writerOpts": { transform: customTransform },
		"parserOpts": {
			"commitsSort": ["committerDate", "date", "subject"],
			"releaseCount": 0, /* para considerar todos os commits */
			"noteKeywords": ["BREAKING CHANGE", "BREAKING CHANGES"]
		}	
	}],
    ["@semantic-release/changelog", { 
        "changelogFile": "CHANGELOG.md",
        "changelogTitle": "# Changelog\n\nAll notable changes to this project will be documented in this file. See\n[Conventional Commits](https://conventionalcommits.org) for commit guidelines.\n\n Type must be one of [build, chore, ci, docs, feat, fix, improvement, perf, refactor, revert, style, test]."
    }],
    ["@semantic-release/git", {
        "message": "chore: deploy ${nextRelease.version} to server \n\n${nextRelease.notes}"
    }]
]

module.exports = {
	plugins
};