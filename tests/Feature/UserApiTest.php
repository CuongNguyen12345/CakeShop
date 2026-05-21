<?php

use App\Models\User;

it('returns users through the api', function () {
    $users = User::factory()
        ->count(2)
        ->sequence(
            ['name' => 'Alice Tester', 'email' => 'alice@example.com'],
            ['name' => 'Bob Tester', 'email' => 'bob@example.com'],
        )
        ->create();

    $this->getJson('/api/users')
        ->assertSuccessful()
        ->assertJsonCount(2, 'data')
        ->assertJsonFragment([
            'name' => $users->first()->name,
            'email' => $users->first()->email,
        ])
        ->assertJsonMissingPath('data.0.password')
        ->assertJsonMissingPath('data.0.remember_token');
});
